import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';

const CATEGORIAS = ['cuenta', 'pagos', 'curso', 'tecnico', 'otro'];

export class CrearTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  asunto!: string;

  @IsString()
  @IsIn(CATEGORIAS)
  categoria!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  texto!: string;
}
