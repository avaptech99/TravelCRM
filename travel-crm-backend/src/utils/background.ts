let _bgOps = 0;
const MAX_BG = 2;

export async function runBG(label: string, fn: () => Promise<void>): Promise<void> {
  if (_bgOps >= MAX_BG) {
    console.log(`[BG:SKIP] ${label} — semaphore full (${_bgOps}/${MAX_BG})`);
    return;
  }
  _bgOps++;
  const start = Date.now();
  try {
    await fn();
    console.log(`[BG:OK] ${label}: ${Date.now() - start}ms`);
  } catch (err: any) {
    console.error(`[BG:FAIL] ${label}:`, err.message);
  } finally {
    _bgOps--;
  }
}

export function getBGStats() {
  return { inFlight: _bgOps, max: MAX_BG };
}
