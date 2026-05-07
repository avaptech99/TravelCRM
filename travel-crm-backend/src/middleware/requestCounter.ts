import { Request, Response, NextFunction } from 'express';

const counters: Record<string, number> = {};

setInterval(() => {
  if (Object.keys(counters).length > 0) {
    console.log('[POLL RATE] Last 60s:', JSON.stringify(counters));
    Object.keys(counters).forEach(k => (counters[k] = 0));
  }
}, 60_000);

export function requestCounter(req: Request, res: Response, next: NextFunction) {
  counters[req.path] = (counters[req.path] ?? 0) + 1;
  next();
}
