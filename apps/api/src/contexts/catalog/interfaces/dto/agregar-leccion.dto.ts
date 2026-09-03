import { IsString, IsNumber, MinLength, IsPositive, IsOptional, IsUrl } from 'class-validator';

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

  @IsOptional()
  @IsUrl({ require_tld: false }) // require_tld: false para permitir http://localhost:...
  videoUrl?: string;
}
