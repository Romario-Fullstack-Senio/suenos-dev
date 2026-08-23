import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificadoOrmEntity } from './certificado.orm-entity';
import { Certificado } from '../../domain/certificado.entity';
import { CertificadoRepository } from '../../domain/certificado.repository.port';

@Injectable()
export class CertificadoTypeOrmRepository implements CertificadoRepository {
  constructor(
    @InjectRepository(CertificadoOrmEntity)
    private readonly repository: Repository<CertificadoOrmEntity>,
  ) {}

  async save(certificado: Certificado): Promise<void> {
    const ormEntity = this.repository.create({
      id: certificado.id,
      estudianteId: certificado.estudianteId,
      cursoId: certificado.cursoId,
      estudianteNombre: certificado.estudianteNombre,
      cursoNombre: certificado.cursoNombre,
      fechaEmision: certificado.fechaEmision,
      codigoVerificacion: certificado.codigoVerificacion,
    });
    await this.repository.save(ormEntity);
  }

  async findById(id: string): Promise<Certificado | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.toDomain(ormEntity);
  }

  async findByCursoYEstudiante(
    cursoId: string,
    estudianteId: string,
  ): Promise<Certificado | null> {
    const ormEntity = await this.repository.findOne({
      where: { cursoId, estudianteId },
    });
    if (!ormEntity) return null;
    return this.toDomain(ormEntity);
  }

  async findByEstudianteId(estudianteId: string): Promise<Certificado[]> {
    const ormEntities = await this.repository.find({
      where: { estudianteId },
    });
    return ormEntities.map(e => this.toDomain(e));
  }

  private toDomain(ormEntity: CertificadoOrmEntity): Certificado {
    return Certificado.emitir(
      ormEntity.id,
      ormEntity.estudianteId,
      ormEntity.cursoId,
      ormEntity.estudianteNombre,
      ormEntity.cursoNombre,
    );
  }
}
