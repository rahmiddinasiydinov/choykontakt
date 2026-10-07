import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Choykontakt API')
    .setDescription(
      'REST API for Choykontakt: Telegram users and choyxona (vendor) directory.',
    )
    .setVersion('0.1.0')
    .addTag('users', 'Telegram users known to the bot')
    .addTag('vendors', 'Choyxonas (tea houses)')
    .addTag('health', 'Liveness / readiness')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}/json`,
    yamlDocumentUrl: `${SWAGGER_PATH}/yaml`,
    swaggerOptions: { persistAuthorization: true },
  });
}
