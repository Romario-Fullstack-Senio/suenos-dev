import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgresoLeccionOrmEntity } from './progreso-leccion.orm-entity';
import { ProgresoLeccion } from '../../domain/progreso-leccion.entity';
import { ProgresoLeccionRepository } from '../../domain/progreso-leccion.repository.port';
import { PorcentajeVisto } from '../../domain/porcentaje-visto.value-object';

@Injectable()
export class ProgresoLeccionTypeormRepository
  implements ProgresoLeccionRepository
{
  constructor(
    @InjectRepository(ProgresoLeccionOrmEntity)
    private readonly ormRepository: Repository<ProgresoLeccionOrmEntity>,
  ) {}

  async save(progreso: ProgresoLeccion): Promise<void> {
    const ormEntity = this.ormRepository.create({
      id: progreso.id,
      estudianteId: progreso.estudianteId,
      leccionId: progreso.leccionId,
      cursoId: progreso.cursoId,
      porcentaje: progreso.porcentaje.value,
      completada: progreso.completada,
    });

    await this.ormRepository.save(ormEntity);
  }

  async findByLeccionYEstudiante(
    leccionId: string,
    estudianteId: string,
  ): Promise<ProgresoLeccion | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { leccionId, estudianteId },
    });

    if (!ormEntity) return null;

    return ProgresoLeccion.reconstitute(
      ormEntity.id,
      ormEntity.estudianteId,
      ormEntity.leccionId,
      ormEntity.cursoId,
      PorcentajeVisto.create(ormEntity.porcentaje),
      ormEntity.completada,
    );
  }

  async findByCursoYEstudiante(
    cursoId: string,
    estudianteId: string,
  ): Promise<ProgresoLeccion[]> {
    const ormEntities = await this.ormRepository.find({
      where: { cursoId, estudianteId },
    });

    return ormEntities.map(e => this.toDomain(e));
  }

  async findByCursoId(cursoId: string): Promise<ProgresoLeccion[]> {
    const ormEntities = await this.ormRepository.find({ where: { cursoId } });
    return ormEntities.map(e => this.toDomain(e));
  }

  private toDomain(e: ProgresoLeccionOrmEntity): ProgresoLeccion {
    return ProgresoLeccion.reconstitute(
      e.id,
      e.estudianteId,
      e.leccionId,
      e.cursoId,
      PorcentajeVisto.create(e.porcentaje),
      e.completada,
    );
  }
}
