import { Inject, Injectable } from '@nestjs/common';
import { NotificacionRepository, NOTIFICACION_REPOSITORY } from '../domain/notificacion.repository.port';
import { Notificacion } from '../domain/notificacion.entity';

@Injectable()
export class NotificacionService {
  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly repo: NotificacionRepository,
  ) {}

  async findByUsuario(usuarioId: string, limit = 20): Promise<Notificacion[]> {
    return this.repo.findByUsuario(usuarioId, limit);
  }

  async countNoLeidas(usuarioId: string): Promise<number> {
    return this.repo.countNoLeidas(usuarioId);
  }

  async marcarComoLeida(id: string): Promise<void> {
    return this.repo.marcarComoLeida(id);
  }

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    return this.repo.marcarTodasLeidas(usuarioId);
  }

  async guardar(notificacion: Notificacion): Promise<void> {
    return this.repo.save(notificacion);
  }
}
