import { ComisionAfiliado } from './comision-afiliado.entity';

export const COMISION_AFILIADO_REPOSITORY = 'COMISION_AFILIADO_REPOSITORY';

export interface ComisionAfiliadoRepository {
  save(comision: ComisionAfiliado): Promise<void>;
  findById(id: string): Promise<ComisionAfiliado | null>;
  findByAfiliadoId(afiliadoId: string): Promise<ComisionAfiliado[]>;
  /** Todas — panel de admin. */
  findAll(): Promise<ComisionAfiliado[]>;
}
