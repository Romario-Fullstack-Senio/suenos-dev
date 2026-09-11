import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipConfig {
  /** Nombre del parámetro de ruta que trae el id del dueño del recurso. */
  paramName?: string;
}

/**
 * Exige que el id de usuario que viaja en la URL sea el del propio usuario
 * autenticado (un admin pasa siempre). Va SIEMPRE después de JwtAuthGuard,
 * que es quien puebla request.user.
 *
 * Sin esto, cualquier usuario logueado podía leer/escribir recursos ajenos
 * cambiando el id de la URL: notificaciones de otro, sus inscripciones, sus
 * certificados (IDOR).
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.get<OwnershipConfig>(OWNERSHIP_KEY, context.getHandler());
    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('No autenticado');

    if (user.rol === 'admin') return true;

    // JwtStrategy.validate() devuelve { id, email, rol } — no `sub`. Antes se
    // comparaba user.sub, que siempre era undefined: el guard rechazaba a
    // todo el mundo menos a los admins, así que nunca se llegó a usar.
    const paramId = request.params[config.paramName || 'id'];
    if (!user.id || user.id !== paramId) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }

    return true;
  }
}
