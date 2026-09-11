import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemaForo, CategoriaForo } from '../../domain/tema-foro.entity';
import { RespuestaForo } from '../../domain/respuesta-foro.entity';
import { TemaForoRepository } from '../../domain/tema-foro.repository.port';
import { TemaForoOrmEntity } from './tema-foro.orm-entity';
import { RespuestaForoOrmEntity } from './respuesta-foro.orm-entity';

@Injectable()
export class TemaForoTypeOrmRepository implements TemaForoRepository {
  constructor(
    @InjectRepository(TemaForoOrmEntity)
    private readonly repo: Repository<TemaForoOrmEntity>,
  ) {}

  async save(tema: TemaForo): Promise<void> {
    const orm = this.repo.create({
      id: tema.id,
      autorId: tema.autorId,
      autorNombre: tema.autorNombre,
      titulo: tema.titulo,
      texto: tema.texto,
      categoria: tema.categoria,
      fijado: tema.fijado,
      cerrado: tema.cerrado,
      reportadoPor: tema.reportadoPor,
      oculta: tema.oculta,
      respuestas: tema.respuestas.map((r) => {
        const rOrm = new RespuestaForoOrmEntity();
        rOrm.id = r.id;
        rOrm.temaId = tema.id;
        rOrm.autorId = r.autorId;
        rOrm.autorNombre = r.autorNombre;
        rOrm.autorEsAdmin = r.autorEsAdmin;
        rOrm.texto = r.texto;
        return rOrm;
      }),
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<TemaForo | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['respuestas'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findVisibles(categoria?: CategoriaForo): Promise<TemaForo[]> {
    const orms = await this.repo.find({
      where: categoria ? { categoria, oculta: false } : { oculta: false },
      relations: ['respuestas'],
      // Fijados primero, después los más nuevos — el orden natural de
      // cualquier foro (anuncios pineados arriba de todo).
      order: { fijado: 'DESC', createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async findAll(): Promise<TemaForo[]> {
    const orms = await this.repo.find({ relations: ['respuestas'], order: { createdAt: 'DESC' } });
    return orms.map((o) => this.toDomain(o));
  }

  async delete(id: string): Promise<void> {
    // ON DELETE CASCADE en tema_id (ver respuesta-foro.orm-entity.ts) borra
    // las respuestas del tema automáticamente.
    await this.repo.delete(id);
  }

  private toDomain(orm: TemaForoOrmEntity): TemaForo {
    const respuestas = (orm.respuestas ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) =>
        RespuestaForo.reconstitute(r.id, {
          autorId: r.autorId,
          autorNombre: r.autorNombre,
          autorEsAdmin: r.autorEsAdmin,
          texto: r.texto,
          createdAt: r.createdAt,
        }),
      );

    return TemaForo.reconstitute(orm.id, {
      autorId: orm.autorId,
      autorNombre: orm.autorNombre,
      titulo: orm.titulo,
      texto: orm.texto,
      categoria: orm.categoria as CategoriaForo,
      fijado: orm.fijado,
      cerrado: orm.cerrado,
      respuestas,
      createdAt: orm.createdAt,
      reportadoPor: orm.reportadoPor ?? [],
      oculta: orm.oculta,
    });
  }
}
