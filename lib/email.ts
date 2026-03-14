import { Resend } from 'resend';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailOptions): Promise<SendEmailResponse> {
  const defaultFrom = `Sistema de Asistencias FUP <${process.env.SMTP_FROM || 'onboarding@resend.dev'}>`;

  try {
    const { data, error } = await resend.emails.send({
      from: from || defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    throw new Error(
      `Error al enviar el correo con Resend: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
