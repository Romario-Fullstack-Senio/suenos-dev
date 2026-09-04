import { IsString, IsNotEmpty } from 'class-validator';

export class Confirmar2FADto {
  @IsString()
  @IsNotEmpty()
  codigo!: string;
}

export class Desactivar2FADto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ConfirmarLogin2FADto {
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @IsString()
  @IsNotEmpty()
  codigo!: string;
}
