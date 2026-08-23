import { Certificado } from './certificado.entity';

export const CERTIFICADO_REPOSITORY = 'CERTIFICADO_REPOSITORY';

export interface CertificadoRepository {
  save(certificado: Certificado): Promise<void>;
  findById(id: string): Promise<Certificado | null>;
  findByCursoYEstudiante(
    cursoId: string,
    estudianteId: string,
  ): Promise<Certificado | null>;
  findByEstudianteId(estudianteId: string): Promise<Certificado[]>;
}
