import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearResenaDto {
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comentario?: string;
}
