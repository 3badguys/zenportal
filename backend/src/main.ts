import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,X-Admin-Token,X-Request-Id',
    exposedHeaders: 'X-Request-Id',
  });

  app.useStaticAssets(join(__dirname, '..', 'storage'), { prefix: '/media/' });

  const port = process.env.PORT || 3000;
  const server = await app.listen(port, '0.0.0.0');
  logger.log(`Server running on http://0.0.0.0:${port}`);

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down...`);
    server.close(() => {
      logger.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrap();
