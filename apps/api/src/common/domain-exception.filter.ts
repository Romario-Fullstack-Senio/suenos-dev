import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  NotFoundDomainError,
  ConflictDomainError,
  UnauthorizedDomainError,
} from '@suenos-dev/shared-kernel';

/**
 * Traduce errores de dominio (framework-agnósticos, ver DomainError en
 * shared-kernel) al código HTTP correcto. Sin este filtro, cualquier regla
 * de negocio violada ("curso no encontrado", "email inválido", "ya existe
 * un usuario con ese email"...) llegaba a NestJS como un `Error` plano, que
 * el framework trata como fallo no controlado y responde 500 Internal
 * Server Error — opaco y semánticamente incorrecto para lo que en realidad
 * son errores de validación (400), de recurso inexistente (404), de
 * conflicto (409) o de autorización (401).
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: HttpStatus[status] ?? 'Error',
    });
  }

  private resolveStatus(exception: DomainError): number {
    if (exception instanceof NotFoundDomainError) return HttpStatus.NOT_FOUND;
    if (exception instanceof ConflictDomainError) return HttpStatus.CONFLICT;
    if (exception instanceof UnauthorizedDomainError) return HttpStatus.UNAUTHORIZED;
    return HttpStatus.BAD_REQUEST;
  }
}
