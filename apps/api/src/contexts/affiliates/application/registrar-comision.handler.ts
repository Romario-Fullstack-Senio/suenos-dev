import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { ComisionAfiliado } from '../domain/comision-afiliado.entity';
import {
  COMISION_AFILIADO_REPOSITORY,
  ComisionAfiliadoRepository,
} from '../domain/comision-afiliado.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface CursoCompradoPayload {
  aggregateId: string; // ordenId
  estudianteId: string;
  cursoId: string;
  cursoNombre: string;
  precio: number;
}

/** CursoComprado dispara un evento por cada ítem de la orden (ver
 * Orden#completar) — acá se evalúa cada compra por separado: si quien
 * compró fue referido por alguien, ese alguien gana una comisión sobre
 * ESE curso puntual, sin importar cuántos otros cursos traiga la misma
 * orden. */
@Injectable()
export class RegistrarComisionHandler {
  private readonly logger = new Logger(RegistrarComisionHandler.name);

  constructor(
    @Inject(COMISION_AFILIADO_REPOSITORY)
    private readonly comisionRepo: ComisionAfiliadoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  @OnEvent('CursoComprado')
  async handle(event: CursoCompradoPayload): Promise<void> {
    const comprador = await this.usuarioRepo.findById(event.estudianteId);
    // Sin referido, o el caso (no debería pasar nunca en el flujo normal,
    // pero por las dudas) de que alguien termine "referido por sí mismo" —
    // ComisionAfiliado.crear() lo rechazaría igual, esto evita el throw.
    if (!comprador?.referidoPor || comprador.referidoPor === event.estudianteId) return;

    const comision = ComisionAfiliado.crear(uuid(), {
      afiliadoId: comprador.referidoPor,
      referidoId: event.estudianteId,
      cursoId: event.cursoId,
      cursoNombre: event.cursoNombre,
      ordenId: event.aggregateId,
      monto: event.precio,
    });
    await this.comisionRepo.save(comision);
    this.logger.log(
      `Comisión generada: ${comision.comisionMonto} para el afiliado ${comprador.referidoPor} (referido: ${event.estudianteId}, curso: ${event.cursoNombre})`,
    );
  }
}
