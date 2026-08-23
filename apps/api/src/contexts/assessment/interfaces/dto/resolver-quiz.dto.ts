import { IsString, IsArray, IsNumber, IsNotEmpty } from 'class-validator';

export class ResolverQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId!: string;

  @IsString()
  @IsNotEmpty()
  estudianteId!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  respuestas!: number[];
}
