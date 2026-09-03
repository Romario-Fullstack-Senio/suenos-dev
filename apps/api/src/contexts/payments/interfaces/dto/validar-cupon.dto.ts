import { IsString, MinLength, IsNumber, IsPositive } from 'class-validator';

export class ValidarCuponDto {
  @IsString()
  @MinLength(1)
  codigo!: string;

  @IsString()
  cursoId!: string;

  @IsNumber()
  @IsPositive()
  precio!: number;
}
