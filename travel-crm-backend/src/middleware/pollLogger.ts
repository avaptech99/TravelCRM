import { Request, Response, NextFunction } from 'express';

const POLLING_ENDPOINTS = [
  '/api/notifications',
  '/api/sync',
  '/api/settings/dropdowns',
];

export function pollLogger(req: Request, res: Response, next: NextFunction) {
  if (POLLING_ENDPOINTS.some(p => req.path.startsWith(p))) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const source = res.getHeader('X-Cache-Status') ?? 'MISS'; // Default to MISS if header not set
      console.log(
        `[POLL] ${req.method} ${req.path} — ${duration}ms | Status: ${res.statusCode} | Cache: ${source} | Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      );
    });
  }
  next();
}
