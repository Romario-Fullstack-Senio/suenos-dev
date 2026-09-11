import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegistrarDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // usuarioId de quien lo invitó (?ref= en el link) — opcional, y si no
  // corresponde a un usuario real se ignora en silencio (ver
  // RegistrarUsuarioUseCase), no rechaza el registro.
  @IsOptional()
  @IsString()
  referidoPor?: string;
}
