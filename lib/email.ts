import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import * as React from 'react';

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

let nodemailerTransporter: nodemailer.Transporter | null = null;

function getNodemailerTransporter() {
  if (!nodemailerTransporter) {
    nodemailerTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return nodemailerTransporter;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

interface SendEmailResponse {
  success: boolean;
  id?: string;
}

async function sendWithResend({
  to,
  subject,
  react,
  from,
}: SendEmailOptions): Promise<SendEmailResponse> {
  const defaultFrom = `Sistema de Asistencias FUP <${process.env.SMTP_FROM || 'onboarding@resend.dev'}>`;

  const { data, error } = await getResend().emails.send({
    from: from || defaultFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
  });

  if (error) {
    console.error('Resend error details:', {
      message: error.message,
      name: error.name,
    });
    throw new Error(error.message);
  }

  return {
    success: true,
    id: data?.id,
  };
}

async function sendWithNodemailer({
  to,
  subject,
  react,
}: SendEmailOptions): Promise<SendEmailResponse> {
  const transporter = getNodemailerTransporter();

  const html = await render(react);

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  });

  return {
    success: true,
    id: info.messageId,
  };
}

export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailOptions): Promise<SendEmailResponse> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;

  if (resendApiKey && resendApiKey.trim() !== '') {
    try {
      return await sendWithResend({ to, subject, react, from });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not verified') || errorMessage.includes('domain')) {
        console.warn('Resend domain not verified, falling back to Gmail SMTP');
      } else {
        throw new Error(`Error al enviar el correo con Resend: ${errorMessage}`);
      }
    }
  }

  if (hasSmtpConfig) {
    return await sendWithNodemailer({ to, subject, react });
  }

  throw new Error(
    'No hay proveedor de correo configurado. Configura RESEND_API_KEY o SMTP_HOST/SMTP_USER/SMTP_PASSWORD'
  );
}
