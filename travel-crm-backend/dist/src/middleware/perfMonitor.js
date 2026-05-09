"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfMonitor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SLOW_THRESHOLD_MS = 500; // log warning if any request exceeds 500ms
const QUEUE_THRESHOLD_MS = 2000; // If > 2s, log pool stats to detect starvation
const perfMonitor = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > SLOW_THRESHOLD_MS) {
            let poolMsg = '';
            // If request is truly slow (>2s), check if it's because the DB pool is exhausted
            if (duration > QUEUE_THRESHOLD_MS) {
                const pool = mongoose_1.default.connection.pool;
                const checkedOut = pool?.checkedOutCount ?? 'N/A';
                poolMsg = ` | Pool CheckedOut: ${checkedOut}`;
            }
            console.warn(`🐌 SLOW REQUEST: ${method} ${originalUrl} — ${duration}ms` +
                ` | Status: ${res.statusCode}` +
                ` | Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` +
                poolMsg);
        }
    });
    next();
};
exports.perfMonitor = perfMonitor;
