"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTimer = createTimer;
function createTimer(label) {
    const segments = [];
    let lastMark = Date.now();
    const start = lastMark;
    return {
        mark(segmentName) {
            const now = Date.now();
            segments.push({ name: segmentName, duration: now - lastMark });
            lastMark = now;
        },
        end(extra) {
            const total = Date.now() - start;
            const breakdown = segments.map(s => `${s.name}: ${s.duration}ms`).join(' | ');
            console.log(`[PERF] ${label} — Total: ${total}ms | ${breakdown}`, extra ?? '');
            return total;
        }
    };
}
