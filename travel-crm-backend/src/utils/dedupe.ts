const inFlight = new Map<string, Promise<any>>();

/**
 * Deduplicates concurrent requests for the same key.
 * If a request for the same key is already in flight, returns the existing promise.
 */
export async function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) {
    return inFlight.get(key)!;
  }
  
  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  
  inFlight.set(key, promise);
  return promise;
}
