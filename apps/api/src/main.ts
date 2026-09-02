import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { initSentry } from './sentry.config';
import { SentryInterceptor } from './sentry.interceptor';

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

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
