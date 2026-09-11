import { Inject, Injectable } from '@nestjs/common';
import { ComisionAfiliado } from '../domain/comision-afiliado.entity';
import {
  COMISION_AFILIADO_REPOSITORY,
  ComisionAfiliadoRepository,
} from '../domain/comision-afiliado.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

export interface ComisionAdminDto {
  id: string;
  afiliadoId: string;
  afiliadoNombre: string;
  referidoId: string;
  referidoNombre: string;
  cursoNombre: string;
  monto: number;
  comisionMonto: number;
  estado: string;
  createdAt: Date;
}

/** Panel de admin — cruza affiliates (comisiones) con identity (nombres),
 * mismo patrón que InstructorController/ObtenerRankingUseCase. */
@Injectable()
export class ListarComisionesAdminUseCase {
  constructor(
    @Inject(COMISION_AFILIADO_REPOSITORY)
    private readonly comisionRepo: ComisionAfiliadoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(): Promise<ComisionAdminDto[]> {
    const comisiones = await this.comisionRepo.findAll();
    const idsUnicos = Array.from(new Set(comisiones.flatMap((c: ComisionAfiliado) => [c.afiliadoId, c.referidoId])));
    const usuarios = await Promise.all(idsUnicos.map((id) => this.usuarioRepo.findById(id)));
    const nombrePorId = new Map(idsUnicos.map((id, i) => [id, usuarios[i]?.nombre ?? 'Usuario']));

    return comisiones.map((c) => ({
      id: c.id,
      afiliadoId: c.afiliadoId,
      afiliadoNombre: nombrePorId.get(c.afiliadoId) ?? 'Usuario',
      referidoId: c.referidoId,
      referidoNombre: nombrePorId.get(c.referidoId) ?? 'Usuario',
      cursoNombre: c.cursoNombre,
      monto: c.monto,
      comisionMonto: c.comisionMonto,
      estado: c.estado,
      createdAt: c.createdAt,
    }));
  }
}
