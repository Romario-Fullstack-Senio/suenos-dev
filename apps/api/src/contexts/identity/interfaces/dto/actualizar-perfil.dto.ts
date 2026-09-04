import { IsString, IsEmail, MinLength } from 'class-validator';

export class ActualizarPerfilDto {
  @IsString()
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  nombre!: string;

  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}
