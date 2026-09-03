import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '../../domain/inscripcion.entity';
import { InscripcionRepository } from '../../domain/inscripcion.repository.port';
import { InscripcionOrmEntity } from './inscripcion.orm-entity';

@Injectable()
export class InscripcionTypeOrmRepository implements InscripcionRepository {
  constructor(
    @InjectRepository(InscripcionOrmEntity)
    private readonly ormRepo: Repository<InscripcionOrmEntity>,
  ) {}

  async save(inscripcion: Inscripcion): Promise<void> {
    const entity = this.ormRepo.create({
      id: inscripcion.id,
      estudianteId: inscripcion.estudianteId,
      cursoId: inscripcion.cursoId,
      fechaInscripcion: inscripcion.fechaInscripcion,
      activa: inscripcion.activa,
    });
    await this.ormRepo.save(entity);
  }

  async findByCursoYEstudiante(cursoId: string, estudianteId: string): Promise<Inscripcion | null> {
    const entity = await this.ormRepo.findOne({ where: { cursoId, estudianteId } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAllByEstudiante(estudianteId: string): Promise<Inscripcion[]> {
    const entities = await this.ormRepo.find({ where: { estudianteId } });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCursoId(cursoId: string): Promise<Inscripcion[]> {
    const entities = await this.ormRepo.find({ where: { cursoId } });
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<Inscripcion[]> {
    const entities = await this.ormRepo.find();
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: InscripcionOrmEntity): Inscripcion {
    return Inscripcion.crear(
      entity.id,
      entity.estudianteId,
      entity.cursoId,
    );
  }
}
