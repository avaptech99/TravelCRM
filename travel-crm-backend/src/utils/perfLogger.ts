export function createTimer(label: string) {
  const segments: { name: string; duration: number }[] = [];
  let lastMark = Date.now();
  const start = lastMark;

  return {
    mark(segmentName: string) {
      const now = Date.now();
      segments.push({ name: segmentName, duration: now - lastMark });
      lastMark = now;
    },
    end(extra?: Record<string, unknown>) {
      const total = Date.now() - start;
      const breakdown = segments.map(s => `${s.name}: ${s.duration}ms`).join(' | ');
      console.log(`[PERF] ${label} — Total: ${total}ms | ${breakdown}`, extra ?? '');
      return total;
    }
  };
}
