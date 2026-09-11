import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CrearRespuestaForoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  texto!: string;
}
