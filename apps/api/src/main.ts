import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { initSentry } from './sentry.config';
import { SentryInterceptor } from './sentry.interceptor';

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
  const VIDEO_BODY_LIMIT = '600mb';
  // `verify` replica lo que hacía la opción `rawBody: true` de Nest con su
  // parser por defecto — StripeWebhookController necesita el buffer crudo
  // (sin parsear) para verificar la firma del webhook.
  const captureRawBody = (req: express.Request, _res: express.Response, buf: Buffer) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  };
  app.use(express.json({ limit: VIDEO_BODY_LIMIT, verify: captureRawBody }));
  app.use(express.urlencoded({ limit: VIDEO_BODY_LIMIT, extended: true, verify: captureRawBody }));

  // El filtro global de Sentry se registra vía DI en AppModule (APP_FILTER),
  // NO con `useGlobalFilters(new SentryGlobalFilter())`: SentryGlobalFilter
  // extiende BaseExceptionFilter, que necesita que Nest le inyecte
  // HttpAdapterHost para inicializar `applicationRef`. Instanciarlo con `new`
  // deja `applicationRef` undefined y CUALQUIER excepción no controlada
  // (un 404, un 401, un error de validación) tumba el proceso completo.
  app.use(helmet());
  app.useGlobalInterceptors(new SentryInterceptor());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [process.env.WEB_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sueños Dev API')
    .setDescription('API para plataforma e-learning Sueños Dev')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
