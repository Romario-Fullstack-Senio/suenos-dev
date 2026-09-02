/**
 * Error de dominio, framework-agnóstico (el dominio no puede importar NestJS —
 * ver reglas de arquitectura). Antes, el dominio y los casos de uso lanzaban
 * `Error` genérico, que NestJS trata como un fallo no controlado y responde
 * 500 Internal Server Error para CUALQUIER violación de regla de negocio
 * ("curso no encontrado", "email inválido", "ya existe un usuario", etc.) —
 * un 500 opaco donde correspondía un 400/404/409.
 *
 * La capa de infraestructura (ver DomainExceptionFilter en apps/api) traduce
 * estas clases al código HTTP apropiado.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

/** El recurso solicitado no existe. Se traduce a 404 Not Found. */
export class NotFoundDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundDomainError';
    Object.setPrototypeOf(this, NotFoundDomainError.prototype);
  }
}

/** El recurso ya existe o el estado actual entra en conflicto con la operación. Se traduce a 409 Conflict. */
export class ConflictDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictDomainError';
    Object.setPrototypeOf(this, ConflictDomainError.prototype);
  }
}

/** Credenciales o permisos inválidos. Se traduce a 401 Unauthorized. */
export class UnauthorizedDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedDomainError';
    Object.setPrototypeOf(this, UnauthorizedDomainError.prototype);
  }
}
