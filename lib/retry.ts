/**
 * Intenta ejecutar una función asíncrona con reintentos automáticos
 * @param fn Función a ejecutar
 * @param maxRetries Número máximo de reintentos (por defecto: 3)
 * @param delay Tiempo de espera entre reintentos en ms (por defecto: 1000ms)
 * @returns Resultado de la función o lanza el último error
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
