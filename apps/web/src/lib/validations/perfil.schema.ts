import { z } from 'zod';

export const perfilSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
});

export type PerfilFormData = z.infer<typeof perfilSchema>;

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(8, 'Mínimo 8 caracteres'),
  passwordNuevo: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarPassword: z.string(),
}).refine(data => data.passwordNuevo === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

export type CambiarPasswordFormData = z.infer<typeof cambiarPasswordSchema>;
