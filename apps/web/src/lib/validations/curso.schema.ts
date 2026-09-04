import { z } from 'zod';

export const NIVELES_CURSO = ['principiante', 'intermedio', 'avanzado'] as const;

export const crearCursoSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  precio: z.number().positive('Debe ser un precio positivo'),
  imagenUrl: z.string().url().optional(),
  categoria: z.string().optional(),
  nivel: z.enum(NIVELES_CURSO).optional().or(z.literal('')),
  // Un ítem por línea en el textarea — se parsean a string[] antes de mandar al backend.
  objetivos: z.string().optional(),
  requisitos: z.string().optional(),
  audiencia: z.string().optional(),
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
  videoUrl: z.string().url().optional(),
  esVistaPrevia: z.boolean().optional(),
  diasDesdeInscripcion: z.number().min(0, 'No puede ser negativo').optional(),
});

export type AgregarLeccionFormData = z.infer<typeof agregarLeccionSchema>;
