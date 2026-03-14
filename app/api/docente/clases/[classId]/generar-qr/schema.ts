import { z } from 'zod';

export const GenerarQRResponseSchema = z.object({
  qrUrl: z.string().url(),
  // Temporarily make this more permissive for debugging
  qrToken: z.string().min(1, 'El token es requerido'),
  expiresAt: z.string().optional(),
});
