import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DiagnosticsService } from './diagnostics/diagnostics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const port = Number(process.env.PORT ?? 4000);
  const bodyLimit = process.env.BODY_SIZE_LIMIT ?? '1mb';
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsAllowList = new Set(corsOrigins);
  const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
  const isLocalOrigin = (origin: string) => {
    try {
      const url = new URL(origin);
      return (
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
        (url.protocol === 'http:' || url.protocol === 'https:')
      );
    } catch {
      return false;
    }
  };

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(json({ limit: bodyLimit }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsAllowList.has(origin)) {
        callback(null, true);
        return;
      }
      if (isDev && isLocalOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const startWithPort = async (startPort: number, attempts: number): Promise<number> => {
    try {
      await app.listen(startPort);
      return startPort;
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === 'EADDRINUSE' && attempts > 0) {
        return startWithPort(startPort + 1, attempts - 1);
      }
      throw error;
    }
  };

  const boundPort = await startWithPort(port, 5);
  const url = await app.getUrl();
  const resolvedPort = Number(new URL(url).port) || boundPort;
  const diagnostics = app.get(DiagnosticsService, { strict: false });
  diagnostics?.setListenInfo(resolvedPort, url);

  const portFile = (process.env.PORT_FILE ?? '').trim();
  if (portFile) {
    const dir = path.dirname(portFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(portFile, `${resolvedPort}`, 'utf-8');
  }

  // eslint-disable-next-line no-console
  console.log(`API server listening on ${url}`);
}

void bootstrap();
