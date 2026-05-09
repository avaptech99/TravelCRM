# IMPROVED CACHE SYSTEM — TravelCRM 3.0
## All-rounder · SSE-ready · Polling-ready · 512MB RAM · Growing users

---

## WHAT'S WRONG WITH THE CURRENT CACHE

From discovery answers:

```
❌ Custom MemoryCache using plain Map — no TTL enforcement on get(),
   no maxKeys limit, no checkperiod cleanup — keys live forever if del() missed

❌ notifications_{userId} TTL is 300s (5 minutes) — way too long
   Agent gets a notification, waits 5 minutes to see it

❌ No TTL constants — raw numbers scattered across controllers
   Change a TTL = hunt through every file

❌ No cache key builder — inline string templates everywhere
   One typo in a key = silent cache miss forever

❌ calendar_ cache never explicitly invalidated — only expires by TTL
   Create a booking with a travel date = calendar shows stale data for 60s

❌ stats_{userId} and recent_{userId} not invalidated by most mutation handlers

❌ No maxKeys — cache grows unbounded as users create unique filter combos
   30 users × many filter combos = hundreds of bookings_ keys accumulate

❌ runBG only in bookingController.ts — other controllers have no semaphore
   notificationController, settingsController unprotected

❌ No cache monitoring — no way to see hit rate, key count, or memory usage
```

---

## STEP 1 — Install node-cache

```bash
npm install node-cache
npm install --save-dev @types/node-cache
```

Why node-cache over your custom Map:
- Built-in TTL enforcement on every get() — expired keys never served
- checkperiod background cleanup — no memory leaks from forgotten keys
- maxKeys hard limit — prevents unbounded growth
- useClones: false — no deep cloning cost on large booking arrays

---

## STEP 2 — Replace src/utils/cache.ts completely

```typescript
// src/utils/cache.ts
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

  ANALYTICS:        300,   // 5min — expensive aggregations, staleness OK

  SYNC:             120,   // 2min — SSE will replace this entirely
} as const;

// ─── Cache key builders — no more inline string templates ────────────────────
export const CK = {
  bookingDetail:   (id: string)                    => `booking_${id}`,
  bookingList:     (params: Record<string, any>)   => `bookings_${stableHash(params)}`,
  bookingStats:    (userId: string)                => `stats_${userId}`,
  bookingRecent:   (userId: string)                => `recent_${userId}`,
  bookingCalendar: (params: Record<string, any>)   => `calendar_${stableHash(params)}`,

  agents:          ()                              => 'users_agents',
  allUsers:        ()                              => 'all_users',
  userProfile:     (userId: string)                => `user_${userId}`,

  notifications:   (userId: string)                => `notif_${userId}`,

  dropdowns:       ()                              => 'settings_dropdowns',
  settings:        ()                              => 'settings_main',

  analytics:       (type: string, params: string)  => `analytics_${type}_${params}`,

  sync:            (userId: string)                => `sync_${userId}`,
} as const;

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
    appCache.del(CK.bookingDetail(bookingId));
    cacheInvalidatePrefix('bookings_');
    cacheInvalidatePrefix('stats_');
    cacheInvalidatePrefix('recent_');
    cacheInvalidatePrefix('calendar_');
    if (userId) appCache.del(CK.sync(userId));
  },

  // payment add or delete
  onPaymentWrite(bookingId: string): void {
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
```

---

## STEP 3 — Create src/utils/background.ts (shared runBG)

Move runBG out of bookingController so ALL controllers can use it:

```typescript
// src/utils/background.ts
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
```

In bookingController.ts — remove the local runBG declaration and import:
```typescript
import { runBG } from '../utils/background';
```

---

## STEP 4 — Update bookingController.ts imports and cache calls

```typescript
// Top of bookingController.ts — replace old cache import:
import { CK, TTL, CacheInvalidation, cacheGet, cacheSet } from '../utils/cache';
import { runBG } from '../utils/background';

// ── In getBookings handler ────────────────────────────────────────────────────
const cacheKey = CK.bookingList(queryParams); // queryParams = your filter object
const cached = cacheGet<any>(cacheKey);
if (cached) return res.status(200).json(cached);
// ... DB query ...
cacheSet(cacheKey, result, TTL.BOOKING_LIST);

// ── In getBookingById ─────────────────────────────────────────────────────────
const cacheKey = CK.bookingDetail(id);
const cached = cacheGet<any>(cacheKey);
if (cached) return res.status(200).json(cached);
// ... DB query ...
cacheSet(cacheKey, booking, TTL.BOOKING_DETAIL);

// ── After any write (createBooking, updateBooking, etc.) ─────────────────────
// Before res.json() — synchronous, 0ms:
CacheInvalidation.onBookingWrite(bookingId, req.user?.id);
res.status(200).json(result);

// ── After payment write ───────────────────────────────────────────────────────
CacheInvalidation.onPaymentWrite(bookingId);
res.status(201).json(payment);
```

---

## STEP 5 — Update notificationController.ts

```typescript
import { CK, TTL, CacheInvalidation, cacheGet, cacheSet } from '../utils/cache';

// In getNotifications:
const cacheKey = CK.notifications(userId);
const cached = cacheGet<any[]>(cacheKey);
if (cached !== null) return res.status(200).json(cached);
// ... DB query ...
cacheSet(cacheKey, data, TTL.NOTIFICATIONS); // 60s not 300s

// After any notification mutation:
CacheInvalidation.onNotificationWrite(userId);
```

---

## STEP 6 — Add cache warm-up on startup

```typescript
// src/utils/cacheWarm.ts
import { CK, TTL, cacheSet } from './cache';
import User from '../models/User';

export async function warmCaches(): Promise<void> {
  try {
    const agents = await User
      .find({ role: { $in: ['agent', 'manager'] } })
      .select('_id name email role groups lastSeen')
      .lean();
    cacheSet(CK.agents(), agents, TTL.AGENTS);
    console.log(`[CACHE] Warm-up: ${agents.length} agents cached`);
  } catch (err: any) {
    console.error('[CACHE] Warm-up failed:', err.message);
    // Non-fatal — app works without warm cache
  }
}
```

In server.ts — call after connectDB():
```typescript
import { warmCaches } from './utils/cacheWarm';
// Inside startWorker():
await connectDB();
await warmDropdownCache(); // already exists
await warmCaches();        // ADD THIS
```

---

## STEP 7 — Add /api/admin/cache-stats monitoring endpoint

```typescript
// Add to settingsRoutes.ts or a new adminRoutes.ts:
import { getCacheStats } from '../utils/cache';
import { getBGStats } from '../utils/background';

router.get('/cache-stats', protect, (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  res.json({
    cache: getCacheStats(),
    background: getBGStats(),
    memory: {
      heapUsed:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      rss:       Math.round(process.memoryUsage().rss       / 1024 / 1024) + 'MB',
    },
    uptime: Math.round(process.uptime()) + 's',
    pid: process.pid,
  });
});
```

---

## COMPLETE INVALIDATION MAP

```
Write event                 Bust these caches
─────────────────────────────────────────────────────────────────
createBooking             → bookings_* stats_* recent_* calendar_*
updateBooking             → booking_{id} bookings_* stats_* recent_* calendar_*
updateBookingStatus       → booking_{id} bookings_* stats_* sync_{userId}
deleteBooking             → booking_{id} bookings_* stats_* recent_* calendar_* analytics_*
assignBooking             → booking_{id} bookings_* stats_*
bulkAssign                → bookings_* stats_*
bulkDelete                → bookings_* stats_* recent_* analytics_*
verifyBooking             → booking_{id} bookings_*
addComment                → booking_{id}
addPassengers             → booking_{id}
updatePassengers          → booking_{id}
addPayment                → booking_{id} analytics_* stats_*
deletePayment             → booking_{id} analytics_* stats_*
Notification.create       → notif_{userId}
markNotificationAsRead    → notif_{userId}
dismissNotification       → notif_{userId}
deleteNotification        → notif_{userId}
createUser/updateUser     → users_agents all_users user_{id}
updateSettings/dropdowns  → settings_dropdowns settings_main
```

---

## MEMORY IMPACT

```
node-cache base overhead:    ~2MB
30 users × booking lists:    ~400 keys × ~5KB avg  = ~2MB
30 users × notifications:    ~30 keys  × ~2KB avg  = ~60KB
Analytics (5 endpoints):     ~5 keys   × ~20KB avg = ~100KB
Agents + dropdowns:          ~2 keys   × ~5KB avg  = ~10KB
──────────────────────────────────────────────────────────────
Total cache:                 ~4-5MB of your 512MB
maxKeys: 1000 hard ceiling → absolute worst case ~8MB

Cache will never be your RAM constraint.
```

---

## VERIFICATION

After deploying, call `GET /api/settings/cache-stats` as admin:

```json
{
  "cache": {
    "keys": 18,
    "hits": 1240,
    "misses": 31,
    "hitRate": "97.6%",
    "vsizeMB": "0.04MB"
  },
  "memory": { "heapUsed": "41MB" }
}
```

Target hit rate for 20 users: **90–98%**
If below 80%: check for missing invalidations or TTLs too short
If keys above 500: check for unbounded filter key generation
