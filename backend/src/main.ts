/**
 * src/main.ts
 *
 * Bootstraps the NestJS AppModule as a headless application context
 * (no HTTP server). This is all that is needed to run the @Cron scheduler.
 *
 * Start with:
 *   npm run scheduler
 *
 * Keep this process running alongside `npm run dev` (Next.js).
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // createApplicationContext does NOT start an HTTP server —
  // just wires up the DI container and activates lifecycle hooks / cron jobs.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  logger.log('InnKeeper Scheduler Process Running');
  logger.log('Press Ctrl+C to stop');

  // Keep process alive; NestJS will handle graceful shutdown on SIGINT/SIGTERM.
  app.enableShutdownHooks();
}

bootstrap().catch((err) => {
  console.error('Failed to start scheduler process', err);
  process.exit(1);
});
