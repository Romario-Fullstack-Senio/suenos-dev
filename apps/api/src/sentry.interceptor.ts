import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    Sentry.withScope((scope) => {
      scope.setTag('http.method', method);
      scope.setTag('http.url', url);
      scope.setExtra('body', request.body);
      scope.setExtra('query', request.query);
      scope.setExtra('params', request.params);
    });

    return next.handle().pipe(
      tap(() => {}),
      catchError((error) => {
        Sentry.captureException(error);
        this.logger.error(`Exception captured: ${method} ${url} - ${error.message}`);
        throw error;
      }),
    );
  }
}
