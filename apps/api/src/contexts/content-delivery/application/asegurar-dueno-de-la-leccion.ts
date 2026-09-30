import { ForbiddenException } from '@nestjs/common';
import { LeccionInfo } from '../../catalog/domain/curso.repository.port';

export interface Caller {
  id: string;
  rol: string;
}

/**
 * Solo el instructor dueño del curso (o un admin) puede cambiar el contenido
 * de sus lecciones. El @Roles('instructor', 'admin') del controller solo
 * prueba que quien llama ES instructor, no que sea el dueño de ESTE curso:
 * sin esto, cualquier instructor podía pisar el video, los subtítulos o los
 * recursos de una lección de otro instructor con solo conocer el leccionId.
 */
export function asegurarDuenoDeLaLeccion(info: LeccionInfo, caller: Caller): void {
  if (caller.rol !== 'admin' && info.instructorId !== caller.id) {
    throw new ForbiddenException('No tenés permiso para modificar el contenido de este curso');
  }
}
