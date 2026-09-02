import { Controller, Get, INestApplication, UnauthorizedException } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

/**
 * Regresión para el bug crítico encontrado en auditoría: registrar
 * SentryGlobalFilter con `app.useGlobalFilters(new SentryGlobalFilter())`
 * (instanciación manual) deja `applicationRef` sin inicializar -- extiende
 * BaseExceptionFilter, que necesita que Nest le inyecte HttpAdapterHost vía
 * DI. El resultado real observado: CUALQUIER excepción no controlada (una
 * ruta inexistente, credenciales inválidas, un guard de auth rechazando)
 * tumbaba el proceso de Node completo, no solo la request.
 *
 * El fix correcto es registrar el filtro vía DI (`{ provide: APP_FILTER,
 * useClass: SentryGlobalFilter }` en un módulo) para que Nest le inyecte
 * sus dependencias correctamente -- ver AppModule.
 *
 * Este test monta un módulo mínimo con el filtro registrado de la forma
 * correcta y verifica que las excepciones más comunes (404, 401) devuelven
 * una respuesta HTTP normal en vez de crashear el proceso.
 */
@Controller('probe')
class ProbeController {
  @Get('unauthorized')
  throwUnauthorized() {
    throw new UnauthorizedException('credenciales inválidas');
  }
}

describe('SentryGlobalFilter (regresión: no debe crashear el proceso)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devuelve 401 normal para una excepción controlada (no cuelga ni crashea)', async () => {
    const res = await request(app.getHttpServer()).get('/probe/unauthorized');
    expect(res.status).toBe(401);
  });

  it('devuelve 404 normal para una ruta inexistente (no cuelga ni crashea)', async () => {
    const res = await request(app.getHttpServer()).get('/probe/no-existe');
    expect(res.status).toBe(404);
  });

  it('el servidor sigue respondiendo después de las excepciones anteriores', async () => {
    // Si el filtro estuviera mal registrado (`new SentryGlobalFilter()` manual),
    // el proceso entero habría muerto en el request anterior y esta petición
    // nunca llegaría a completarse.
    const res = await request(app.getHttpServer()).get('/probe/unauthorized');
    expect(res.status).toBe(401);
  });
});
