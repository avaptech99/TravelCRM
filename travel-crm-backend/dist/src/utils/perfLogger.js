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
            const now = Date.now();
            const total = now - start;
            // If there's time since the last mark, add it as 'final'
            if (now > lastMark) {
                segments.push({ name: 'finalProcessing', duration: now - lastMark });
            }
            const breakdown = segments.map(s => `${s.name}: ${s.duration}ms`).join(' | ');
            console.log(`[PERF] ${label} — Total: ${total}ms | ${breakdown}`, extra ?? '');
            return total;
        }
    };
}
