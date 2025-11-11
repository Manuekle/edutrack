import nodemailer, { SentMessageInfo } from 'nodemailer';
import * as React from 'react';
import { render } from '@react-email/render';

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  response?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailOptions): Promise<SendEmailResponse> {
  const defaultFrom = `Sistema de Asistencias FUP <${process.env.SMTP_FROM || 'noreply@fup.edu.co'}>`;

  try {
    // Render React component to HTML and plain text
    const html = await render(react, { pretty: true });
    const text = await render(react, { plainText: true });

    const mailOptions = {
      from: from || defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    };

    const info: SentMessageInfo = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    throw new Error(
      `Error al enviar el correo: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
