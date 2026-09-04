import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pregunta } from '../../domain/pregunta.entity';
import { Respuesta } from '../../domain/respuesta.entity';
import { PreguntaRepository } from '../../domain/pregunta.repository.port';
import { PreguntaOrmEntity } from './pregunta.orm-entity';
import { RespuestaOrmEntity } from './respuesta.orm-entity';

@Injectable()
export class PreguntaTypeOrmRepository implements PreguntaRepository {
  constructor(
    @InjectRepository(PreguntaOrmEntity)
    private readonly repo: Repository<PreguntaOrmEntity>,
  ) {}

  async save(pregunta: Pregunta): Promise<void> {
    const orm = this.repo.create({
      id: pregunta.id,
      cursoId: pregunta.cursoId,
      leccionId: pregunta.leccionId,
      autorId: pregunta.autorId,
      autorNombre: pregunta.autorNombre,
      autorEsInstructor: pregunta.autorEsInstructor,
      texto: pregunta.texto,
      resuelta: pregunta.resuelta,
      respuestas: pregunta.respuestas.map((r) => {
        const respOrm = new RespuestaOrmEntity();
        respOrm.id = r.id;
        respOrm.preguntaId = pregunta.id;
        respOrm.autorId = r.autorId;
        respOrm.autorNombre = r.autorNombre;
        respOrm.autorEsInstructor = r.autorEsInstructor;
        respOrm.texto = r.texto;
        return respOrm;
      }),
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Pregunta | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['respuestas'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByLeccionId(leccionId: string): Promise<Pregunta[]> {
    const orms = await this.repo.find({
      where: { leccionId },
      relations: ['respuestas'],
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async delete(id: string): Promise<void> {
    // ON DELETE CASCADE en pregunta_id (ver respuesta.orm-entity.ts) borra
    // las respuestas de la pregunta automáticamente.
    await this.repo.delete(id);
  }

  private toDomain(orm: PreguntaOrmEntity): Pregunta {
    const respuestas = (orm.respuestas ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) =>
        Respuesta.reconstitute(r.id, {
          autorId: r.autorId,
          autorNombre: r.autorNombre,
          autorEsInstructor: r.autorEsInstructor,
          texto: r.texto,
          createdAt: r.createdAt,
        }),
      );

    return Pregunta.reconstitute(orm.id, {
      cursoId: orm.cursoId,
      leccionId: orm.leccionId,
      autorId: orm.autorId,
      autorNombre: orm.autorNombre,
      autorEsInstructor: orm.autorEsInstructor,
      texto: orm.texto,
      resuelta: orm.resuelta,
      respuestas,
      createdAt: orm.createdAt,
    });
  }
}
