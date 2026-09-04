import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';

const EMISOR = 'Sueños Dev';

@Injectable()
export class Iniciar2FAUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  /** Genera un secreto TOTP nuevo y lo guarda "pendiente" (sin activar
   * todavía) — recién queda activo cuando el usuario confirma con un código
   * real vía Confirmar2FAUseCase. Se puede llamar de nuevo para regenerar
   * el secreto si el usuario no llegó a escanear el QR. */
  async execute(usuarioId: string): Promise<{ secret: string; qrDataUrl: string; otpauthUrl: string }> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundDomainError('Usuario no encontrado');

    const secret = authenticator.generateSecret();
    usuario.iniciarConfiguracionDosFactores(secret);
    await this.usuarioRepo.save(usuario);

    const otpauthUrl = authenticator.keyuri(usuario.email.value, EMISOR, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrDataUrl, otpauthUrl };
  }
}
