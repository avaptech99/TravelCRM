"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestCounter = requestCounter;
const counters = {};
setInterval(() => {
    if (Object.keys(counters).length > 0) {
        console.log('[POLL RATE] Last 60s:', JSON.stringify(counters));
        Object.keys(counters).forEach(k => (counters[k] = 0));
    }
}, 60_000);
function requestCounter(req, res, next) {
    counters[req.path] = (counters[req.path] ?? 0) + 1;
    next();
}
