import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bootstrapDatabase } from './db/bootstrap';
import { setupSwagger, SWAGGER_PATH } from './swagger';

async function bootstrap() {
  // Migrate + seed before anything can hit the DB.
  await bootstrapDatabase();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api', { exclude: ['/', 'health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`HTTP on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(
    `Swagger on http://localhost:${port}/${SWAGGER_PATH}`,
    'Bootstrap',
  );
}

bootstrap().catch((err: unknown) => {
  Logger.error(
    err instanceof Error ? (err.stack ?? err.message) : String(err),
    'Bootstrap',
  );
  process.exit(1);
});
