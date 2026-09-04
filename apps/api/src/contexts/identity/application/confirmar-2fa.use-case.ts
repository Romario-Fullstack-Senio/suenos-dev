import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, DomainError } from '@suenos-dev/shared-kernel';
import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { hashToken } from './token-hash.util';

const CANTIDAD_CODIGOS_RESPALDO = 8;

@Injectable()
export class Confirmar2FAUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  /** Confirma la activación con un código TOTP real (prueba que el usuario
   * efectivamente escaneó el QR con su app) y genera los códigos de
   * respaldo — se devuelven en texto plano UNA sola vez acá; en la DB solo
   * queda su hash (mismo criterio que el refresh token: son valores de alta
   * entropía generados por nosotros, no contraseñas elegidas por un humano). */
  async execute(usuarioId: string, codigo: string): Promise<{ codigosRespaldo: string[] }> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundDomainError('Usuario no encontrado');
    if (!usuario.twoFactorSecret) {
      throw new DomainError('Primero tenés que iniciar la configuración de la verificación en dos pasos');
    }

    const valido = authenticator.verify({ token: codigo, secret: usuario.twoFactorSecret });
    if (!valido) {
      throw new DomainError('El código ingresado no es válido — revisá que tu app muestre el código actual');
    }

    const codigosRespaldo = Array.from({ length: CANTIDAD_CODIGOS_RESPALDO }, () =>
      randomBytes(5).toString('hex'),
    );
    usuario.confirmarActivacionDosFactores(codigosRespaldo.map(hashToken));
    await this.usuarioRepo.save(usuario);

    return { codigosRespaldo };
  }
}
