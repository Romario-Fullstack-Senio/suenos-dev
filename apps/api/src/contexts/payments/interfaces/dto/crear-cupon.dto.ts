import { IsString, MinLength, IsNumber, IsPositive, IsOptional, IsIn, IsISO8601 } from 'class-validator';
import { TIPOS_CUPON, TipoCupon } from '../../domain/cupon.entity';

export class CrearCuponDto {
  @IsString()
  @MinLength(3)
  codigo!: string;

  @IsIn(TIPOS_CUPON)
  tipo!: TipoCupon;

  @IsNumber()
  @IsPositive()
  valor!: number;

  @IsOptional()
  @IsString()
  cursoId?: string;

  @IsOptional()
  @IsISO8601()
  fechaExpiracion?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  usosMaximos?: number;
}
