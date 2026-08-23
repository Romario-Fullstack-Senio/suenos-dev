import { z } from 'zod';

export const crearCursoSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  precio: z.number().positive('Debe ser un precio positivo'),
});

export type CrearCursoFormData = z.infer<typeof crearCursoSchema>;

export const agregarModuloSchema = z.object({
  titulo: z.string().min(2, 'Mínimo 2 caracteres'),
  orden: z.number().positive('Debe ser un número positivo'),
});

export type AgregarModuloFormData = z.infer<typeof agregarModuloSchema>;

export const agregarLeccionSchema = z.object({
  titulo: z.string().min(2, 'Mínimo 2 caracteres'),
  orden: z.number().positive('Debe ser un número positivo'),
  duracionSegundos: z.number().positive('Debe ser un número positivo'),
});

export type AgregarLeccionFormData = z.infer<typeof agregarLeccionSchema>;
