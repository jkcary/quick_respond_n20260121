import { Injectable, Logger } from '@nestjs/common';
import os from 'os';

export type StartupTelemetry = {
  startedAt: string;
  pid: number;
  nodeVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  hostname: string;
  cwd: string;
  execPath: string;
  uptimeSeconds: number;
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  env: {
    nodeEnv?: string;
    port?: string;
    corsOrigins?: string;
    rateLimitTtl?: string;
    rateLimitLimit?: string;
    bodySizeLimit?: string;
    requestTimeoutMs?: string;
  };
  listen?: {
    port: number;
    url: string;
  };
};

const buildStartupTelemetry = (): StartupTelemetry => ({
  startedAt: new Date().toISOString(),
  pid: process.pid,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  hostname: os.hostname(),
  cwd: process.cwd(),
  execPath: process.execPath,
  uptimeSeconds: process.uptime(),
  memory: process.memoryUsage(),
  cpu: process.cpuUsage(),
  env: {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    corsOrigins: process.env.CORS_ORIGINS,
    rateLimitTtl: process.env.RATE_LIMIT_TTL,
    rateLimitLimit: process.env.RATE_LIMIT_LIMIT,
    bodySizeLimit: process.env.BODY_SIZE_LIMIT,
    requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS,
  },
});

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);
  private readonly startupTelemetry = buildStartupTelemetry();

  getStartupTelemetry(): StartupTelemetry {
    return this.startupTelemetry;
  }

  setListenInfo(port: number, url: string): void {
    this.startupTelemetry.listen = { port, url };
    this.logger.log(`Startup telemetry captured for ${url}`);
  }
}
