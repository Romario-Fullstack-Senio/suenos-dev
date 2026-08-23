import { IsString, MinLength, IsNumber, IsPositive } from 'class-validator';

export class CrearCursoDto {
  @IsString()
  @MinLength(3)
  titulo!: string;

  @IsString()
  descripcion!: string;

  @IsNumber()
  @IsPositive()
  precio!: number;

  @IsString()
  instructorId!: string;
}
