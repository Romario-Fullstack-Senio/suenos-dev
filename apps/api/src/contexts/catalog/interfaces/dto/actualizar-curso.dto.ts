import { IsString, MinLength, IsNumber, IsPositive, IsOptional, IsUrl, IsIn, IsArray } from 'class-validator';
import { NIVELES_CURSO, NivelCurso } from '../../domain/curso.entity';

export class ActualizarCursoDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  precio?: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
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
