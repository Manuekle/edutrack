/**
 * Tests para lib/email.ts
 */

import { sendEmail, SendEmailOptions } from '@/lib/email';
import * as React from 'react';

// Mock de resend
const mockSend = jest.fn();
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: (...args: any[]) => mockSend(...args),
      },
    })),
  };
});

describe('Email Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
  });

  describe('sendEmail', () => {
    const mockReactElement = React.createElement('div', null, 'Test Email');

    it('debería enviar un email correctamente con Resend', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockSend.mockResolvedValue({
        data: { id: 'test-resend-id' },
        error: null,
      });

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.id).toBe('test-resend-id');
      expect(mockSend).toHaveBeenCalledWith({
        from: expect.stringContaining('Sistema de Asistencias FUP'),
        to: ['test@example.com'],
        subject: 'Test Subject',
        react: mockReactElement,
      });
    });

    it('debería enviar email a múltiples destinatarios', async () => {
      const options: SendEmailOptions = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockSend.mockResolvedValue({
        data: { id: 'test-resend-id' },
        error: null,
      });

      await sendEmail(options);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        })
      );
    });

    it('debería usar el remitente personalizado si se proporciona', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
        from: 'custom@example.com',
      };

      mockSend.mockResolvedValue({
        data: { id: 'test-resend-id' },
        error: null,
      });

      await sendEmail(options);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('debería lanzar un error si falla el envío del email con Resend', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Resend API Error' },
      });

      await expect(sendEmail(options)).rejects.toThrow('Error al enviar el correo con Resend: Resend API Error');
    });

    it('debería lanzar un error si hay una excepción no controlada', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockSend.mockRejectedValue(new Error('Network failure'));

      await expect(sendEmail(options)).rejects.toThrow('Error al enviar el correo con Resend: Network failure');
    });
  });
});
