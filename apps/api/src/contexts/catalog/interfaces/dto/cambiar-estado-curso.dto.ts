import { IsIn } from 'class-validator';

export class CambiarEstadoCursoDto {
  @IsIn(['borrador', 'publicado'])
  estado!: 'borrador' | 'publicado';
}
