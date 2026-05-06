/**
 * Simple in-memory cache with TTL support.
 * Uses a Map internally — no external dependencies required.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();

    /**
     * Get a value from the cache.
     * Returns null if the key doesn't exist or has expired.
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set a value in the cache with a TTL (in seconds).
     */
    set<T>(key: string, data: T, ttlSeconds: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Delete a specific key from the cache.
     */
    del(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Delete all keys that start with a given prefix.
     * Useful for invalidating all booking-related caches at once.
     */
    invalidateByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear the entire cache.
     */
    flush(): void {
        this.cache.clear();
    }
}

// Single shared instance across the entire app
const appCache = new MemoryCache();
export default appCache;
