import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';

const CATEGORIAS = ['general', 'ayuda', 'proyectos', 'anuncios', 'sugerencias'];

export class CrearTemaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsString()
  @IsIn(CATEGORIAS)
  categoria!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  texto!: string;
}
