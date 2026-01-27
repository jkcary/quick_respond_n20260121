import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  id?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const existing = req.headers['x-request-id'];
    const requestId =
      typeof existing === 'string' && existing.trim().length > 0
        ? existing.trim()
        : uuidv4();

    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
