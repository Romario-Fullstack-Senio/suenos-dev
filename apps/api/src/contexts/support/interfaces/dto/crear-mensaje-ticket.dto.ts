import { IsString, MinLength, MaxLength } from 'class-validator';

export class CrearMensajeTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  texto!: string;
}
