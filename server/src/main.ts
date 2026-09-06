/**
 * FluentUp - Application Entry Point (Bootstrap)
 * 
 * Yeh file NestJS HTTP server ko bootstrap karti hai:
 * 1. Express application instance create karti hai
 * 2. CORS allow karti hai taaki React Native mobile app connect ho sake
 * 3. Environment variable se dynamic port listen karti hai
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Nest application logger initialize kiya
  const logger = new Logger('FluentUpBootstrap');

  // NestFactory ke zariye root AppModule se application instance create kiya
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for profile photos & avatars (Base64 data URIs)
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  // ConfigService inject karke environment variables access kiye
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || '*';

  // Cross-Origin Resource Sharing (CORS) enable kiya taaki mobile client block na ho
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global API Prefix: Sabhi API routes '/api' ke under accessible honge (e.g. /api/health)
  app.setGlobalPrefix('api');

  // Server ko configured port par start kiya
  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(`🚀 FluentUp Server running at: http://localhost:${port}/api`);
  logger.log(`📡 Health check available at: http://localhost:${port}/api/health`);
  logger.log(`====================================================`);
}

// Bootstrap function execute kiya
bootstrap();
