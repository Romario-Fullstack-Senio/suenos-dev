import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipConfig {
  paramName?: string;
}

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

    const paramId = request.params[config.paramName || 'id'];
    if (user.sub !== paramId) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }

    return true;
  }
}
