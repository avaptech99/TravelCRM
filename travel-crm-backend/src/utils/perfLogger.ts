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
