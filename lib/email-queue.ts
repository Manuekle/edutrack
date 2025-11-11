/**
 * Sistema de cola de correos con reintentos automáticos
 * Maneja el envío de correos con reintentos y manejo de errores
 */

import { sendEmail, type SendEmailOptions } from './email';

export interface EmailQueueItem {
  id: string;
  options: SendEmailOptions;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

export interface EmailQueueConfig {
  maxAttempts?: number;
  retryDelayMs?: number;
  batchSize?: number;
}

const DEFAULT_CONFIG: Required<EmailQueueConfig> = {
  maxAttempts: 3,
  retryDelayMs: 15 * 60 * 1000, // 15 minutos
  batchSize: 10,
};

class EmailQueue {
  private queue: EmailQueueItem[] = [];
  private processing = false;
  private config: Required<EmailQueueConfig>;
  private processingInterval?: NodeJS.Timeout;

  constructor(config: EmailQueueConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Agregar un correo a la cola
   */
  async enqueue(options: SendEmailOptions): Promise<string> {
    const id = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const item: EmailQueueItem = {
      id,
      options,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      status: 'pending',
    };

    this.queue.push(item);
    this.processQueue();

    return id;
  }

  /**
   * Procesar la cola de correos
   */
  private async processQueue() {
    if (this.processing) return;

    this.processing = true;

    try {
      // Obtener items pendientes o que necesitan reintento
      const now = new Date();
      const itemsToProcess = this.queue
        .filter(
          item =>
            item.status === 'pending' ||
            (item.status === 'failed' &&
              item.attempts < item.maxAttempts &&
              (!item.nextRetry || item.nextRetry <= now))
        )
        .slice(0, this.config.batchSize);

      if (itemsToProcess.length === 0) {
        this.processing = false;
        return;
      }

      // Procesar items en paralelo
      await Promise.allSettled(itemsToProcess.map(item => this.processItem(item)));
    } catch (error) {
      // Error en el procesamiento de la cola
    } finally {
      this.processing = false;

      // Programar siguiente procesamiento si hay items pendientes
      const hasPendingItems = this.queue.some(
        item =>
          item.status === 'pending' ||
          (item.status === 'failed' && item.attempts < item.maxAttempts)
      );

      if (hasPendingItems) {
        // Procesar nuevamente después de un delay
        setTimeout(() => this.processQueue(), this.config.retryDelayMs);
      }
    }
  }

  /**
   * Procesar un item individual
   */
  private async processItem(item: EmailQueueItem) {
    item.status = 'processing';
    item.attempts += 1;
    item.lastAttempt = new Date();

    try {
      await sendEmail(item.options);
      item.status = 'success';
    } catch (error) {
      item.error = error instanceof Error ? error.message : String(error);

      if (item.attempts >= item.maxAttempts) {
        item.status = 'failed';
      } else {
        item.status = 'failed';
        // Calcular próximo reintento (exponential backoff)
        const delay = this.config.retryDelayMs * Math.pow(2, item.attempts - 1);
        item.nextRetry = new Date(Date.now() + delay);
      }
    }
  }

  /**
   * Obtener el estado de un correo
   */
  getStatus(id: string): EmailQueueItem | undefined {
    return this.queue.find(item => item.id === id);
  }

  /**
   * Obtener estadísticas de la cola
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      success: this.queue.filter(item => item.status === 'success').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
    };
  }

  /**
   * Limpiar items antiguos (opcional)
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAgeMs);
    this.queue = this.queue.filter(
      item => !item.lastAttempt || item.lastAttempt > cutoff || item.status === 'pending'
    );
  }

  /**
   * Iniciar procesamiento automático
   */
  start() {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(() => {
      this.processQueue();
      this.cleanup();
    }, this.config.retryDelayMs);
  }

  /**
   * Detener procesamiento automático
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }
}

// Instancia singleton de la cola de correos
let emailQueueInstance: EmailQueue | null = null;

export function getEmailQueue(): EmailQueue {
  if (!emailQueueInstance) {
    emailQueueInstance = new EmailQueue();
    // Iniciar procesamiento automático en producción
    if (process.env.NODE_ENV === 'production') {
      emailQueueInstance.start();
    }
  }
  return emailQueueInstance;
}

/**
 * Función helper para enviar correos usando la cola
 */
export async function sendEmailWithQueue(options: SendEmailOptions): Promise<string> {
  const queue = getEmailQueue();
  return queue.enqueue(options);
}

/**
 * Función helper para enviar correos inmediatamente (sin cola)
 * Útil para correos críticos que deben enviarse de inmediato
 */
export async function sendEmailImmediate(options: SendEmailOptions) {
  return sendEmail(options);
}
