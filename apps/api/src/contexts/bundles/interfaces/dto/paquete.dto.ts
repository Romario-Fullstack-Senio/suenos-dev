import { IsString, IsNotEmpty, MaxLength, IsArray, ArrayMinSize, IsInt, Min, Max, IsOptional } from 'class-validator';

export class PaqueteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  cursoIds!: string[];

  @IsInt()
  @Min(1)
  @Max(90)
  descuentoPorcentaje!: number;
}
