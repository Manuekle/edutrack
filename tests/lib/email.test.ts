/**
 * Tests para lib/email.ts
 */

import { sendEmail, SendEmailOptions } from '@/lib/email';
import * as React from 'react';

// Mock de nodemailer
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn();
  return {
    __esModule: true,
    default: {
      createTransport: jest.fn(() => ({
        sendMail: mockSendMail,
      })),
    },
    mockSendMail, // Exportar para usar en los tests
  };
});

// Mock de @react-email/render
jest.mock('@react-email/render', () => {
  const mockRender = jest.fn();
  return {
    render: mockRender,
    mockRender, // Exportar para usar en los tests
  };
});

describe('Email Utilities', () => {
  let mockSendMail: jest.Mock;
  let mockRender: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Obtener los mocks
    const nodemailerModule = jest.requireMock('nodemailer');
    const renderModule = jest.requireMock('@react-email/render');

    // Obtener la instancia del transporter que se creó
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.default.createTransport();
    mockSendMail = transporter.sendMail as jest.Mock;
    mockRender = renderModule.render as jest.Mock;

    mockSendMail.mockClear();
    mockRender.mockClear();
  });

  describe('sendEmail', () => {
    const mockReactElement = React.createElement('div', null, 'Test Email');

    it('debería enviar un email correctamente', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockRender
        .mockResolvedValueOnce('<div>Test Email HTML</div>')
        .mockResolvedValueOnce('<div>Test Email Text</div>');
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK',
      });

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(result.response).toBe('250 OK');
      expect(mockRender).toHaveBeenCalledWith(mockReactElement, { pretty: true });
      expect(mockRender).toHaveBeenCalledWith(mockReactElement, { plainText: true });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.stringContaining('Sistema de Asistencias FUP'),
        to: ['test@example.com'],
        subject: 'Test Subject',
        html: '<div>Test Email HTML</div>',
        text: '<div>Test Email Text</div>',
      });
    });

    it('debería enviar email a múltiples destinatarios', async () => {
      const options: SendEmailOptions = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockRender
        .mockResolvedValueOnce('<div>Test Email HTML</div>')
        .mockResolvedValueOnce('<div>Test Email Text</div>');
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK',
      });

      await sendEmail(options);

      expect(mockSendMail).toHaveBeenCalledWith(
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

      mockRender
        .mockResolvedValueOnce('<div>Test Email HTML</div>')
        .mockResolvedValueOnce('<div>Test Email Text</div>');
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK',
      });

      await sendEmail(options);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('debería usar el remitente por defecto si no se proporciona', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockRender
        .mockResolvedValueOnce('<div>Test Email HTML</div>')
        .mockResolvedValueOnce('<div>Test Email Text</div>');
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK',
      });

      await sendEmail(options);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('Sistema de Asistencias FUP'),
        })
      );
    });

    it('debería lanzar un error si falla el envío del email', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockRender
        .mockResolvedValueOnce('<div>Test Email HTML</div>')
        .mockResolvedValueOnce('<div>Test Email Text</div>');
      const error = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(error);

      await expect(sendEmail(options)).rejects.toThrow('Error al enviar el correo:');
    });

    it('debería manejar errores de renderizado', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      const error = new Error('Render error');
      mockRender.mockRejectedValue(error);

      await expect(sendEmail(options)).rejects.toThrow();
    });

    it('debería renderizar el componente React a HTML y texto plano', async () => {
      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        react: mockReactElement,
      };

      mockRender
        .mockResolvedValueOnce('<div>HTML Content</div>')
        .mockResolvedValueOnce('Plain Text Content');
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK',
      });

      await sendEmail(options);

      expect(mockRender).toHaveBeenCalledTimes(2);
      expect(mockRender).toHaveBeenNthCalledWith(1, mockReactElement, { pretty: true });
      expect(mockRender).toHaveBeenNthCalledWith(2, mockReactElement, { plainText: true });
    });
  });
});
