import { z } from 'zod';

export const preguntaSchema = z.object({
  enunciado: z.string().min(5, 'Mínimo 5 caracteres'),
  opciones: z.array(z.string().min(1, 'Opción vacía')).min(2, 'Mínimo 2 opciones'),
  respuestaCorrecta: z.number().min(0, 'Selecciona una respuesta'),
});

export const crearQuizSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres'),
  cursoId: z.string().uuid('ID de curso inválido'),
  puntajeMinimo: z.number().min(0).max(100, 'Máximo 100'),
  preguntas: z.array(preguntaSchema).min(1, 'Mínimo 1 pregunta'),
});

export type CrearQuizFormData = z.infer<typeof crearQuizSchema>;
export type PreguntaFormData = z.infer<typeof preguntaSchema>;

export const resolverQuizSchema = z.object({
  quizId: z.string().uuid(),
  estudianteId: z.string().uuid(),
  respuestas: z.array(z.number().min(0)),
});

export type ResolverQuizFormData = z.infer<typeof resolverQuizSchema>;
