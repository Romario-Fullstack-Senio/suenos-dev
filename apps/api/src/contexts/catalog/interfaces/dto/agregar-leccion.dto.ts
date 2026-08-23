import { IsString, IsNumber, MinLength, IsPositive } from 'class-validator';

export class AgregarLeccionDto {
  @IsString()
  @MinLength(2)
  titulo!: string;

  @IsNumber()
  @IsPositive()
  orden!: number;

  @IsNumber()
  @IsPositive()
  duracionSegundos!: number;
}
