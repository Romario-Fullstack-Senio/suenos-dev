import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './app.module';
import { initSentry } from './sentry.config';
import { SentryInterceptor } from './sentry.interceptor';

/**
 * Rechaza la request ANTES de leer el body si no trae un access token válido
 * (y el rol pedido). Es un corte temprano para no bufferear cientos de MB de
 * alguien sin permiso — la autorización real la siguen haciendo los guards
 * del controller (JwtAuthGuard/RolesGuard), esto no los reemplaza.
 */
function exigirTokenAntesDelBody(jwtService: JwtService, roles?: string[]): express.RequestHandler {
  return (req, res, next) => {
    // El preflight CORS nunca trae Authorization.
    if (req.method === 'OPTIONS') return next();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    let payload: { rol?: string; purpose?: string } | null = null;
    try {
      payload = token ? jwtService.verify(token) : null;
    } catch {
      payload = null;
    }
    // Cualquier token con `purpose` (session-hint, 2FA pendiente, media) no
    // es un access token — mismo criterio que JwtStrategy.validate.
    if (!payload || payload.purpose) {
      res.status(401).json({ statusCode: 401, message: 'No autorizado' });
      return;
    }
    if (roles && !roles.includes(payload.rol ?? '')) {
      res.status(403).json({ statusCode: 403, message: 'No tenés permiso para subir archivos acá' });
      return;
    }
    next();
  };
}

async function bootstrap() {
  initSentry();

  // bodyParser: false porque el body-parser por defecto de Nest tiene un
  // límite de 100kb — insuficiente para el upload de video (POST /videos/upload
  // manda el archivo como base64 dentro del JSON). Se registra manualmente
  // más abajo con un límite mayor.
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  // CORS antes que los parsers de body: el rechazo temprano de las rutas de
  // subida (más abajo) tiene que salir con headers CORS, si no el navegador
  // lo muestra como un error de CORS en vez del 401/403 real.
  app.enableCors({
    origin: [process.env.WEB_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // `verify` replica lo que hacía la opción `rawBody: true` de Nest con su
  // parser por defecto — StripeWebhookController necesita el buffer crudo
  // (sin parsear) para verificar la firma del webhook.
  const captureRawBody = (req: express.Request, _res: express.Response, buf: Buffer) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  };

  // Antes había UN solo límite de 600mb para TODAS las rutas, y el parseo del
  // body corre antes que cualquier guard o throttle: cualquiera, sin login,
  // podía mandar un JSON gigante a cualquier endpoint y el contenedor de la
  // API (mem_limit 512m) moría por falta de memoria. Ahora solo las rutas que
  // de verdad reciben archivos (en base64 dentro del JSON) aceptan cuerpos
  // grandes, cada una con su propio techo, y verifican el JWT y el rol ANTES
  // de leer el body. El resto queda en 1mb.
  const jwtService = app.get(JwtService, { strict: false });
  const INSTRUCTOR = ['instructor', 'admin'];
  const RUTAS_DE_SUBIDA: { path: string; limit: string; roles?: string[] }[] = [
    { path: '/api/videos/upload', limit: '600mb', roles: INSTRUCTOR },
    { path: '/api/videos/upload-recurso', limit: '100mb', roles: INSTRUCTOR },
    { path: '/api/videos/upload-subtitulos', limit: '5mb', roles: INSTRUCTOR },
    { path: '/api/cursos/imagenes/upload', limit: '15mb', roles: INSTRUCTOR },
    { path: '/api/usuarios/me/avatar', limit: '15mb' },
  ];
  for (const ruta of RUTAS_DE_SUBIDA) {
    app.use(ruta.path, exigirTokenAntesDelBody(jwtService, ruta.roles));
    app.use(ruta.path, express.json({ limit: ruta.limit, verify: captureRawBody }));
  }
  // body-parser no vuelve a parsear un body que ya parseó una ruta de arriba
  // (req._body), así que esto solo aplica al resto.
  app.use(express.json({ limit: '1mb', verify: captureRawBody }));
  app.use(express.urlencoded({ limit: '1mb', extended: true, verify: captureRawBody }));

  // El filtro global de Sentry se registra vía DI en AppModule (APP_FILTER),
  // NO con `useGlobalFilters(new SentryGlobalFilter())`: SentryGlobalFilter
  // extiende BaseExceptionFilter, que necesita que Nest le inyecte
  // HttpAdapterHost para inicializar `applicationRef`. Instanciarlo con `new`
  // deja `applicationRef` undefined y CUALQUIER excepción no controlada
  // (un 404, un 401, un error de validación) tumba el proceso completo.
  app.use(helmet());
  app.useGlobalInterceptors(new SentryInterceptor());
  // 'health' queda FUERA del prefijo /api a propósito: el HEALTHCHECK del
  // Dockerfile y el paso de verificación de deploy.yml/deploy-preprod.yml
  // pegan a http://localhost:3001/health (sin /api) — sin este exclude,
  // esa ruta nunca existió (siempre fue /api/health), así que el container
  // de la API JAMÁS se reportó "healthy" y cualquier servicio con
  // depends_on: api condition: service_healthy (el web) nunca arrancaba.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger queda público sin ningún control de acceso propio — exponerlo
  // tal cual en producción es un mapa completo de la API (rutas, DTOs,
  // shapes de auth) para cualquiera. Se apaga por defecto en NODE_ENV=production,
  // salvo que se pida explícitamente con ENABLE_SWAGGER=true (útil en preprod).
  const swaggerHabilitado =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';

  if (swaggerHabilitado) {
    const config = new DocumentBuilder()
      .setTitle('Sueños Dev API')
      .setDescription('API para plataforma e-learning Sueños Dev')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
  if (swaggerHabilitado) {
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }
}
bootstrap();
