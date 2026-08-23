import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from '../../domain/curso.entity';
import { CursoRepository } from '../../domain/curso.repository.port';
import { Precio } from '../../domain/precio.value-object';
import { Slug } from '../../domain/slug.value-object';
import { EstadoCurso } from '../../domain/estado-curso.value-object';
import { Modulo } from '../../domain/modulo.entity';
import { Leccion } from '../../domain/leccion.entity';
import { CursoOrmEntity } from './curso.orm-entity';
import { ModuloOrmEntity } from './modulo.orm-entity';
import { LeccionOrmEntity } from './leccion.orm-entity';

@Injectable()
export class CursoTypeOrmRepository implements CursoRepository {
  constructor(
    @InjectRepository(CursoOrmEntity)
    private readonly repo: Repository<CursoOrmEntity>,
  ) {}

  async save(curso: Curso): Promise<void> {
    const modulos = curso.modulos.map(m => {
      const modOrm = new ModuloOrmEntity();
      modOrm.id = m.id;
      modOrm.titulo = m.titulo;
      modOrm.orden = m.orden;
      modOrm.curso_id = curso.id;
      modOrm.lecciones = m.lecciones.map(l => {
        const lecOrm = new LeccionOrmEntity();
        lecOrm.id = l.id;
        lecOrm.titulo = l.titulo;
        lecOrm.orden = l.orden;
        lecOrm.duracion_segundos = l.duracionSegundos;
        lecOrm.video_url = l.videoUrl || null;
        lecOrm.modulo_id = m.id;
        return lecOrm;
      });
      return modOrm;
    });

    const orm = this.repo.create({
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      precio: curso.precio.value,
      moneda: curso.precio.currency,
      slug: curso.slug.value,
      estado: curso.estado.value,
      instructor_id: curso.instructorId,
      modulos,
    });

    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Curso | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['modulos', 'modulos.lecciones'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findBySlug(slug: string): Promise<Curso | null> {
    const orm = await this.repo.findOne({ where: { slug }, relations: ['modulos', 'modulos.lecciones'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findAll(): Promise<Curso[]> {
    const orms = await this.repo.find({ relations: ['modulos', 'modulos.lecciones'] });
    return orms.map(o => this.toDomain(o));
  }

  async findByInstructorId(instructorId: string): Promise<Curso[]> {
    const orms = await this.repo.find({
      where: { instructor_id: instructorId },
      relations: ['modulos', 'modulos.lecciones'],
    });
    return orms.map(o => this.toDomain(o));
  }

  private toDomain(orm: CursoOrmEntity): Curso {
    const modulos = (orm.modulos || []).map(m => {
      const lecciones = (m.lecciones || []).map(l =>
        Leccion.reconstitute(l.id, {
          titulo: l.titulo,
          orden: l.orden,
          duracionSegundos: l.duracion_segundos,
          videoUrl: l.video_url ?? undefined,
        }),
      );
      return Modulo.reconstitute(m.id, {
        titulo: m.titulo,
        orden: m.orden,
        lecciones,
      });
    });

    return Curso.reconstitute(orm.id, {
      titulo: orm.titulo,
      descripcion: orm.descripcion,
      precio: Precio.create(orm.precio, orm.moneda),
      slug: Slug.from(orm.titulo),
      estado: EstadoCurso.from(orm.estado),
      instructorId: orm.instructor_id,
      modulos,
    });
  }
}
