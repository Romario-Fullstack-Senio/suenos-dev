import { IsString, MinLength, IsNumber, IsPositive, IsOptional, IsUrl, IsIn } from 'class-validator';
import { NIVELES_CURSO, NivelCurso } from '../../domain/curso.entity';

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

  @IsOptional()
  @IsUrl({ require_tld: false }) // require_tld: false para permitir http://localhost:...
  imagenUrl?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsIn(NIVELES_CURSO)
  nivel?: NivelCurso;
}
