import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intento } from '../../domain/intento.entity';
import { IntentoRepository } from '../../domain/intento.repository.port';
import { IntentoOrmEntity } from './intento.orm-entity';

@Injectable()
export class IntentoTypeOrmRepository implements IntentoRepository {
  constructor(
    @InjectRepository(IntentoOrmEntity)
    private readonly repo: Repository<IntentoOrmEntity>,
  ) {}

  async save(intento: Intento): Promise<void> {
    const orm = this.repo.create({
      id: intento.id,
      estudiante_id: intento.estudianteId,
      quiz_id: intento.quizId,
      respuestas: intento.respuestas,
      puntaje: intento.puntaje,
      aprobado: intento.aprobado,
    });
    await this.repo.save(orm);
  }
}
