import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import type { RequestWithId } from './request-id.middleware';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithId, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req as Request;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const requestId = req.id ?? '-';
      const status = res.statusCode;
      this.logger.log(
        `${method} ${originalUrl} ${status} ${duration}ms rid=${requestId}`,
      );
    });

    next();
  }
}
