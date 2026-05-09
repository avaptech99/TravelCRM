"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBG = runBG;
exports.getBGStats = getBGStats;
let _bgOps = 0;
const MAX_BG = 2;
async function runBG(label, fn) {
    if (_bgOps >= MAX_BG) {
        console.log(`[BG:SKIP] ${label} — semaphore full (${_bgOps}/${MAX_BG})`);
        return;
    }
    _bgOps++;
    const start = Date.now();
    try {
        await fn();
        console.log(`[BG:OK] ${label}: ${Date.now() - start}ms`);
    }
    catch (err) {
        console.error(`[BG:FAIL] ${label}:`, err.message);
    }
    finally {
        _bgOps--;
    }
}
function getBGStats() {
    return { inFlight: _bgOps, max: MAX_BG };
}
