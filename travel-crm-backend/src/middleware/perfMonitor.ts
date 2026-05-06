import { Request, Response, NextFunction } from 'express';

const SLOW_THRESHOLD_MS = 500; // log warning if any request exceeds 500ms

export const perfMonitor = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > SLOW_THRESHOLD_MS) {
            console.warn(
                `🐌 SLOW REQUEST: ${method} ${originalUrl} — ${duration}ms` +
                ` | Status: ${res.statusCode}` +
                ` | Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
            );
        }
    });

    next();
};
