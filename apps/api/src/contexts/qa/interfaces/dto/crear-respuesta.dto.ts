import { IsString, MinLength, MaxLength } from 'class-validator';

export class CrearRespuestaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  texto!: string;
}
