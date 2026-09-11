import { Notificacion } from './notificacion.entity';

export const NOTIFICACION_REPOSITORY = 'NOTIFICACION_REPOSITORY';

export interface NotificacionRepository {
  save(notificacion: Notificacion): Promise<void>;
  findByUsuario(usuarioId: string, limit?: number): Promise<Notificacion[]>;
  countNoLeidas(usuarioId: string): Promise<number>;
  marcarComoLeida(id: string): Promise<void>;
  marcarTodasLeidas(usuarioId: string): Promise<void>;
  /** Usado cuando se borra un curso (ver CursoEliminado) — sin esto, las
   * notificaciones "curso nuevo"/"pregunta nueva" que ya apuntaban a ese
   * curso quedan huérfanas: tocarlas manda a un cursoId inexistente. */
  deleteByCursoId(cursoId: string): Promise<void>;
}
