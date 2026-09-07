import { Inject, Injectable } from '@nestjs/common';
import {
  COMISION_AFILIADO_REPOSITORY,
  ComisionAfiliadoRepository,
} from '../domain/comision-afiliado.repository.port';
import { PORCENTAJE_COMISION } from '../domain/comision-afiliado.entity';

export interface ResumenAfiliadoDto {
  porcentajeComision: number;
  totalGanado: number;
  totalPendiente: number;
  totalPagado: number;
  comisiones: {
    id: string;
    cursoNombre: string;
    monto: number;
    comisionMonto: number;
    estado: string;
    createdAt: Date;
  }[];
}

@Injectable()
export class ObtenerResumenAfiliadoUseCase {
  constructor(
    @Inject(COMISION_AFILIADO_REPOSITORY)
    private readonly comisionRepo: ComisionAfiliadoRepository,
  ) {}

  async execute(usuarioId: string): Promise<ResumenAfiliadoDto> {
    const comisiones = await this.comisionRepo.findByAfiliadoId(usuarioId);
    const totalGanado = comisiones.reduce((sum, c) => sum + c.comisionMonto, 0);
    const totalPagado = comisiones.filter((c) => c.estado === 'pagada').reduce((sum, c) => sum + c.comisionMonto, 0);

    return {
      porcentajeComision: PORCENTAJE_COMISION,
      totalGanado: Math.round(totalGanado * 100) / 100,
      totalPagado: Math.round(totalPagado * 100) / 100,
      totalPendiente: Math.round((totalGanado - totalPagado) * 100) / 100,
      comisiones: comisiones.map((c) => ({
        id: c.id,
        cursoNombre: c.cursoNombre,
        monto: c.monto,
        comisionMonto: c.comisionMonto,
        estado: c.estado,
        createdAt: c.createdAt,
      })),
    };
  }
}
