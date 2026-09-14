import { IsString, MinLength, IsNumber, Min, IsOptional, IsUrl, IsIn, IsArray } from 'class-validator';
import { NIVELES_CURSO, NivelCurso } from '../../domain/curso.entity';

export class ActualizarCursoDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Min(0), no IsPositive — ver comentario en CrearCursoDto.
  @IsOptional()
  @IsNumber()
  @Min(0)
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
