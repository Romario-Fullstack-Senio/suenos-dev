import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistrarDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
