import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso, NivelCurso } from '../../domain/curso.entity';
import { BuscarCursosFiltros, CursoRepository, LeccionInfo, ResultadoBusquedaCursos } from '../../domain/curso.repository.port';
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
        lecOrm.subtitulos_url = l.subtitulosUrl || null;
        lecOrm.es_vista_previa = l.esVistaPrevia;
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
      imagen_url: curso.imagenUrl ?? null,
      categoria: curso.categoria ?? null,
      nivel: curso.nivel ?? null,
      objetivos: curso.objetivos.length > 0 ? [...curso.objetivos] : null,
      requisitos: curso.requisitos.length > 0 ? [...curso.requisitos] : null,
      audiencia: curso.audiencia ?? null,
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

  async delete(id: string): Promise<void> {
    // ON DELETE CASCADE en modulo_id/curso_id y leccion_id/modulo_id (ver
    // modulo.orm-entity.ts / leccion.orm-entity.ts) se encarga de borrar
    // módulos y lecciones — no hace falta borrarlos a mano acá.
    await this.repo.delete(id);
  }

  async findInfoByLeccionId(leccionId: string): Promise<LeccionInfo | null> {
    // leccion.id es `uuid` en Postgres — un leccionId con formato inválido
    // (un 404 de video pedido con cualquier string, por ejemplo) hace que
    // Postgres tire QueryFailedError en vez de devolver 0 filas. Un id mal
    // formado nunca puede coincidir con una lección real, así que lo
    // tratamos como "no encontrada" en vez de dejar que reviente en 500.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leccionId)) {
      return null;
    }

    const row = await this.repo.manager
      .createQueryBuilder(LeccionOrmEntity, 'leccion')
      .innerJoin(ModuloOrmEntity, 'modulo', 'modulo.id = leccion.modulo_id')
      .innerJoin(CursoOrmEntity, 'curso', 'curso.id = modulo.curso_id')
      .where('leccion.id = :leccionId', { leccionId })
      .select('leccion.es_vista_previa', 'esVistaPrevia')
      .addSelect('modulo.curso_id', 'cursoId')
      .addSelect('curso.instructor_id', 'instructorId')
      .getRawOne();

    if (!row) return null;
    return { cursoId: row.cursoId, esVistaPrevia: row.esVistaPrevia, instructorId: row.instructorId };
  }

  async findByInstructorId(instructorId: string): Promise<Curso[]> {
    const orms = await this.repo.find({
      where: { instructor_id: instructorId },
      relations: ['modulos', 'modulos.lecciones'],
    });
    return orms.map(o => this.toDomain(o));
  }

  async search(filtros: BuscarCursosFiltros): Promise<ResultadoBusquedaCursos> {
    const qb = this.repo.createQueryBuilder('curso');

    if (filtros.soloPublicados) {
      qb.andWhere('curso.estado = :estado', { estado: 'publicado' });
    }
    if (filtros.texto) {
      // ILIKE (case-insensitive) sobre título Y descripción — búsqueda simple
      // de texto libre, suficiente para el volumen de cursos actual. Si el
      // catálogo creciera mucho, esto es lo primero que migraría a full-text
      // search de Postgres (tsvector) o un motor dedicado.
      qb.andWhere('(curso.titulo ILIKE :texto OR curso.descripcion ILIKE :texto)', {
        texto: `%${filtros.texto}%`,
      });
    }
    if (filtros.categoria) {
      qb.andWhere('curso.categoria = :categoria', { categoria: filtros.categoria });
    }
    if (filtros.nivel) {
      qb.andWhere('curso.nivel = :nivel', { nivel: filtros.nivel });
    }

    if (filtros.ordenarPor === 'precio_asc') {
      qb.orderBy('curso.precio', 'ASC');
    } else if (filtros.ordenarPor === 'precio_desc') {
      qb.orderBy('curso.precio', 'DESC');
    } else {
      qb.orderBy('curso.created_at', 'DESC');
    }

    const porPagina = filtros.porPagina ?? 12;
    const pagina = filtros.pagina ?? 1;
    qb.skip((pagina - 1) * porPagina).take(porPagina);

    const [orms, total] = await qb.getManyAndCount();
    return { cursos: orms.map(o => this.toDomain(o)), total };
  }

  private toDomain(orm: CursoOrmEntity): Curso {
    const modulos = (orm.modulos || []).map(m => {
      const lecciones = (m.lecciones || []).map(l =>
        Leccion.reconstitute(l.id, {
          titulo: l.titulo,
          orden: l.orden,
          duracionSegundos: l.duracion_segundos,
          videoUrl: l.video_url ?? undefined,
          subtitulosUrl: l.subtitulos_url ?? undefined,
          esVistaPrevia: l.es_vista_previa,
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
      imagenUrl: orm.imagen_url ?? undefined,
      categoria: orm.categoria ?? undefined,
      nivel: (orm.nivel as NivelCurso) ?? undefined,
      objetivos: orm.objetivos ?? [],
      requisitos: orm.requisitos ?? [],
      audiencia: orm.audiencia ?? undefined,
      modulos,
    });
  }
}
