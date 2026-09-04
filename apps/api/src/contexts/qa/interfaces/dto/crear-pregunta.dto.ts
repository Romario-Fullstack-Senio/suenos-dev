import { IsString, MinLength, MaxLength } from 'class-validator';

export class CrearPreguntaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  texto!: string;
}
