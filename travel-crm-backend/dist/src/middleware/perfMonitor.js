"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfMonitor = void 0;
const SLOW_THRESHOLD_MS = 500; // log warning if any request exceeds 500ms
const perfMonitor = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > SLOW_THRESHOLD_MS) {
            console.warn(`🐌 SLOW REQUEST: ${method} ${originalUrl} — ${duration}ms` +
                ` | Status: ${res.statusCode}` +
                ` | Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        }
    });
    next();
};
exports.perfMonitor = perfMonitor;
