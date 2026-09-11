import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnershipGuard, OwnershipConfig } from './ownership.guard';

function contexto(user: unknown, params: Record<string, string>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    getHandler: () => () => undefined,
  } as never;
}

function guardCon(config: OwnershipConfig | undefined) {
  const reflector = { get: () => config } as unknown as Reflector;
  return new OwnershipGuard(reflector);
}

describe('OwnershipGuard', () => {
  const config = { paramName: 'userId' };

  it('deja pasar al dueño del recurso', () => {
    const guard = guardCon(config);
    expect(guard.canActivate(contexto({ id: 'u1', rol: 'estudiante' }, { userId: 'u1' }))).toBe(true);
  });

  // El caso que hacía falta cerrar: otro usuario logueado pidiendo el
  // recurso de un tercero con solo cambiar el id de la URL.
  it('bloquea a otro usuario logueado', () => {
    const guard = guardCon(config);
    expect(() => guard.canActivate(contexto({ id: 'u2', rol: 'estudiante' }, { userId: 'u1' })))
      .toThrow(ForbiddenException);
  });

  it('deja pasar a un admin sobre cualquier recurso', () => {
    const guard = guardCon(config);
    expect(guard.canActivate(contexto({ id: 'admin-1', rol: 'admin' }, { userId: 'u1' }))).toBe(true);
  });

  // Antes comparaba user.sub, que JwtStrategy nunca devuelve (usa `id`):
  // el guard rechazaba a TODOS los no-admin, así que no se podía usar.
  it('usa user.id (no user.sub) para comparar', () => {
    const guard = guardCon(config);
    expect(() => guard.canActivate(contexto({ sub: 'u1', rol: 'estudiante' }, { userId: 'u1' })))
      .toThrow(ForbiddenException);
    expect(guard.canActivate(contexto({ id: 'u1', sub: 'otro', rol: 'estudiante' }, { userId: 'u1' }))).toBe(true);
  });

  it('no aplica si la ruta no declara @RequireOwnership', () => {
    const guard = guardCon(undefined);
    expect(guard.canActivate(contexto({ id: 'u2', rol: 'estudiante' }, { userId: 'u1' }))).toBe(true);
  });

  it('rechaza si no hay usuario autenticado', () => {
    const guard = guardCon(config);
    expect(() => guard.canActivate(contexto(undefined, { userId: 'u1' }))).toThrow(ForbiddenException);
  });

  it('usa "id" como parámetro por defecto', () => {
    const guard = guardCon({});
    expect(guard.canActivate(contexto({ id: 'u1', rol: 'estudiante' }, { id: 'u1' }))).toBe(true);
    expect(() => guard.canActivate(contexto({ id: 'u1', rol: 'estudiante' }, { id: 'otro' })))
      .toThrow(ForbiddenException);
  });
});
