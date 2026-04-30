"use strict";
/**
 * Simple in-memory cache with TTL support.
 * Uses a Map internally — no external dependencies required.
 */
Object.defineProperty(exports, "__esModule", { value: true });
class MemoryCache {
    cache = new Map();
    /**
     * Get a value from the cache.
     * Returns null if the key doesn't exist or has expired.
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Set a value in the cache with a TTL (in seconds).
     */
    set(key, data, ttlSeconds) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    /**
     * Delete a specific key from the cache.
     */
    del(key) {
        this.cache.delete(key);
    }
    /**
     * Delete all keys that start with a given prefix.
     * Useful for invalidating all booking-related caches at once.
     */
    invalidateByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Clear the entire cache.
     */
    flush() {
        this.cache.clear();
    }
}
// Single shared instance across the entire app
const appCache = new MemoryCache();
exports.default = appCache;
