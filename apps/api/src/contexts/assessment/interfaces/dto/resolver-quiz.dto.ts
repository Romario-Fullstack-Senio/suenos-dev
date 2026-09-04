import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class ResolverQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId!: string;

  @IsString()
  @IsNotEmpty()
  estudianteId!: string;

  // Un array de índices seleccionados por pregunta — class-validator no
  // valida el tipo del contenido anidado acá (igual que el resto de los
  // DTOs de este contexto), la validación real de índices/tipo de pregunta
  // ocurre en el dominio (Pregunta.crear/verificar).
  @IsArray()
  respuestas!: number[][];
}
