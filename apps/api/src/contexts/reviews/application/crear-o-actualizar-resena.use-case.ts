import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { Resena } from '../domain/resena.entity';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../../enrollment/domain/inscripcion.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { v4 as uuid } from 'uuid';

export interface CrearOActualizarResenaCommand {
  cursoId: string;
  estudianteId: string;
  calificacion: number;
  comentario?: string;
}

@Injectable()
export class CrearOActualizarResenaUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepo: InscripcionRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(command: CrearOActualizarResenaCommand): Promise<{ id: string }> {
    // Solo quien compró el curso puede opinar sobre él — evita reseñas de
    // gente que nunca lo tomó (misma lógica de plataformas como Udemy).
    const inscripcion = await this.inscripcionRepo.findByCursoYEstudiante(command.cursoId, command.estudianteId);
    if (!inscripcion?.activa) {
      throw new UnauthorizedDomainError('Solo podés dejar una reseña si estás inscripto en el curso');
    }

    const existente = await this.resenaRepo.findByCursoYEstudiante(command.cursoId, command.estudianteId);
    if (existente) {
      existente.editar(command.calificacion, command.comentario);
      await this.resenaRepo.save(existente);
      return { id: existente.id };
    }

    const usuario = await this.usuarioRepo.findById(command.estudianteId);
    if (!usuario) {
      throw new NotFoundDomainError('Usuario no encontrado');
    }

    const id = uuid();
    const resena = Resena.crear(id, {
      cursoId: command.cursoId,
      estudianteId: command.estudianteId,
      estudianteNombre: usuario.nombre,
      calificacion: command.calificacion,
      comentario: command.comentario,
    });
    await this.resenaRepo.save(resena);
    return { id };
  }
}
