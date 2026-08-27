import NodeCache from 'node-cache';

// ─── Cache instance ───────────────────────────────────────────────────────────
const appCache = new NodeCache({
  stdTTL: 60,           // default — always override per cacheSet() call
  checkperiod: 30,      // scan for expired keys every 30s — prevents memory leak
  useClones: false,     // no deep cloning — critical for large booking arrays
  maxKeys: 1000,        // hard ceiling — prevents unbounded filter-combo growth
  deleteOnExpire: true, // auto-delete expired entries immediately
});

// ─── TTL constants — one place to change everything ──────────────────────────
export const TTL = {
  BOOKING_DETAIL:    30,   // 30s — busted on every write
  BOOKING_LIST:      30,   // 30s — many filter combos, bust on any booking write
  BOOKING_STATS:    120,   // 2min — dashboard stats
  BOOKING_RECENT:    60,   // 1min — recent bookings widget
  BOOKING_CALENDAR:  60,   // 1min — calendar view

  AGENTS:           600,   // 10min — almost never changes
  ALL_USERS:         60,   // 1min — role changes must propagate quickly
  USER_PROFILE:     120,   // 2min — individual profile

  NOTIFICATIONS:     60,   // 1min — was 300s, far too long for a live CRM
                           // SSE will push instantly, cache = cold-load only

  DROPDOWNS:       3600,   // 1hr — never changes mid-session
  SETTINGS:        3600,   // 1hr — system settings

  ANALYTICS_SHORT:  120,   // 2min
  ANALYTICS_LONG:   600,   // 10min
  ANALYTICS:        300,   // 5min fallback
  
  USERS:             60,   // 1min
  SYNC:             120,   // 2min
} as const;

// ─── Cache key builders — no more inline string templates ────────────────────
export const CK = {
  bookingDetail:   (id: string)                    => `booking_${id}`,
  // userId included: queries like myBookings=true/assignedTo mean something
  // different per user, so the cache key must be scoped per user, not just
  // per query-string -- otherwise different users' results collide.
  bookingList:     (params: Record<string, any>, userId?: string) => `bookings_${userId || 'anon'}_${stableHash(params)}`,
  bookingStats:    (userId: string)                => `stats_${userId}`,
  bookingRecent:   (userId: string)                => `recent_${userId}`,
  bookingCalendar: (params: Record<string, any>)   => `calendar_${stableHash(params)}`,

  agents:          ()                              => 'users_agents',
  allUsers:        ()                              => 'all_users',
  userProfile:     (userId: string)                => `user_${userId}`,

  notifications:   (userId: string)                => `notif_${userId}`,

  dropdowns:       ()                              => 'settings_dropdowns',
  settings:        ()                              => 'settings_main',

  analytics:       (type: string, params: any)     => `analytics_${type}_${stableHash(params)}`,

  sync:            (userId: string)                => `sync_${userId}`,
} as const;

// ─── Per-booking write versioning ──────────────────────────────────────────────
// Closes a race: a GET that started before a write can still be mid-flight
// (real Atlas/Render network latency, not instant) when that write's
// invalidation runs. If the GET then finishes and blindly caches its
// pre-write snapshot, it silently re-poisons the cache for the full TTL --
// invisible to the client until the next lucky cache miss. A reader captures
// the version before it starts; if the version moved by the time it's ready
// to cache, a write happened mid-flight, so it skips caching (correctness
// over hit rate -- the next request just does a fresh, safe read).
const bookingWriteVersion = new Map<string, number>();

export function bumpBookingWriteVersion(bookingId: string): void {
  bookingWriteVersion.set(bookingId, (bookingWriteVersion.get(bookingId) || 0) + 1);
}

export function getBookingWriteVersion(bookingId: string): number {
  return bookingWriteVersion.get(bookingId) || 0;
}

// ─── Typed cache wrappers ─────────────────────────────────────────────────────
export function cacheGet<T>(key: string): T | null {
  const val = appCache.get<T>(key);
  return val !== undefined ? val : null;
}

export function cacheSet<T>(key: string, value: T, ttl: number): void {
  appCache.set(key, value, ttl);
}

export function cacheDel(key: string): void {
  appCache.del(key);
}

export function cacheInvalidatePrefix(prefix: string): void {
  const keys = appCache.keys().filter((k: string) => k.startsWith(prefix));
  if (keys.length > 0) appCache.del(keys);
}

// ─── Invalidation helpers — one function per event type ──────────────────────
// ALL synchronous (0ms). Call BEFORE res.json(). Never await.

export const CacheInvalidation = {

  // ANY booking write: create, update, delete, status, assign, verify
  onBookingWrite(bookingId: string, userId?: string): void {
    bumpBookingWriteVersion(bookingId);
    appCache.del(CK.bookingDetail(bookingId));
    cacheInvalidatePrefix('bookings_');
    cacheInvalidatePrefix('stats_');
    cacheInvalidatePrefix('recent_');
    cacheInvalidatePrefix('calendar_');
    if (userId) appCache.del(CK.sync(userId));
  },

  // payment add or delete
  onPaymentWrite(bookingId: string): void {
    bumpBookingWriteVersion(bookingId);
    appCache.del(CK.bookingDetail(bookingId));
    cacheInvalidatePrefix('analytics_');
    cacheInvalidatePrefix('stats_');
  },

  // notification create, read, dismiss, delete
  onNotificationWrite(userId: string): void {
    appCache.del(CK.notifications(userId));
  },

  // user create, update, delete, role change
  onUserWrite(): void {
    appCache.del(CK.agents());
    appCache.del(CK.allUsers());
    cacheInvalidatePrefix('user_');
  },

  // settings or dropdown update
  onSettingsWrite(): void {
    appCache.del(CK.dropdowns());
    appCache.del(CK.settings());
  },

  // comment, passenger, attachment — detail only
  onBookingDetailWrite(bookingId: string): void {
    bumpBookingWriteVersion(bookingId);
    appCache.del(CK.bookingDetail(bookingId));
  },

  // bulk operations — nuclear option
  flush(): void {
    appCache.flushAll();
    console.log('[CACHE] Full flush executed');
  },
};

// ─── Stats for monitoring endpoint ───────────────────────────────────────────
export function getCacheStats() {
  const s = appCache.getStats();
  const total = s.hits + s.misses;
  return {
    keys:    s.keys,
    hits:    s.hits,
    misses:  s.misses,
    hitRate: total > 0 ? ((s.hits / total) * 100).toFixed(1) + '%' : '0%',
    ksize:   s.ksize,   // key size in bytes
    vsize:   s.vsize,   // value size in bytes
    vsizeMB: (s.vsize / 1024 / 1024).toFixed(2) + 'MB',
  };
}

// ─── Internal ─────────────────────────────────────────────────────────────────
// Stable object hash — {a:1,b:2} and {b:2,a:1} produce same key
function stableHash(obj: Record<string, any>): string {
  const clean = Object.keys(obj)
    .sort()
    .reduce((acc: Record<string, any>, k) => {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') acc[k] = v;
      return acc;
    }, {});
  return JSON.stringify(clean);
}

export default appCache;
