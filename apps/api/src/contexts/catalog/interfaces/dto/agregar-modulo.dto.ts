import { IsString, IsNumber, MinLength } from 'class-validator';

export class AgregarModuloDto {
  @IsString()
  @MinLength(2)
  titulo!: string;

  @IsNumber()
  orden!: number;
}
