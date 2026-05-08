import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

const SLOW_THRESHOLD_MS = 500; // log warning if any request exceeds 500ms
const QUEUE_THRESHOLD_MS = 2000; // If > 2s, log pool stats to detect starvation

export const perfMonitor = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        
        if (duration > SLOW_THRESHOLD_MS) {
            let poolMsg = '';
            
            // If request is truly slow (>2s), check if it's because the DB pool is exhausted
            if (duration > QUEUE_THRESHOLD_MS) {
                const pool = (mongoose.connection as any).pool;
                const checkedOut = pool?.checkedOutCount ?? 'N/A';
                poolMsg = ` | Pool CheckedOut: ${checkedOut}`;
            }

            console.warn(
                `🐌 SLOW REQUEST: ${method} ${originalUrl} — ${duration}ms` +
                ` | Status: ${res.statusCode}` +
                ` | Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` +
                poolMsg
            );
        }
    });

    next();
};
