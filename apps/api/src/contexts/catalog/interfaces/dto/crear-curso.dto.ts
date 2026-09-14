import { IsString, MinLength, IsNumber, Min, IsOptional, IsUrl, IsIn, IsArray } from 'class-validator';
import { NIVELES_CURSO, NivelCurso } from '../../domain/curso.entity';

export class CrearCursoDto {
  @IsString()
  @MinLength(3)
  titulo!: string;

  @IsString()
  descripcion!: string;

  // Min(0), no IsPositive: el dominio (Precio.create) permite 0 a propósito
  // — un curso gratis es un precio válido, solo se rechazan los negativos.
  @IsNumber()
  @Min(0)
  precio!: number;

  @IsString()
  instructorId!: string;

  @IsOptional()
  @IsUrl({ require_tld: false }) // require_tld: false para permitir http://localhost:...
  imagenUrl?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsIn(NIVELES_CURSO)
  nivel?: NivelCurso;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitos?: string[];

  @IsOptional()
  @IsString()
  audiencia?: string;
}
