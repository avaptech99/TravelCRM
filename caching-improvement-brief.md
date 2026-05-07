# 🗄️ Caching Improvement Brief
**App:** TravelCRM Backend (Node.js + Mongoose)
**Based on:** `detail-logs.md` instrumentation output
**Scale target:** 20 users now, growing

---

## Current Caching State (What the Logs Show)

### ✅ Working Well — Do Not Touch
| Cache Key | Hit Time | Status |
|---|---|---|
| `notifications_userId` | <1ms | Working — but TTL too short, see Issue #3 |
| `settings_dropdowns` | <1ms | Working well |
| `users_agents` | <1ms | Working well |
| `bookingById_id` | <1ms | Working — but invalidated too aggressively, see Issue #2 |

### ❌ Not Cached At All — Must Fix
| Endpoint | DB Time | Poll Rate (1 user) | DB Hits at 20 users |
|---|---|---|---|
| `GET /api/sync` | 134ms–11,414ms | 2×/min | **40×/min** |
| `GET /api/bookings/calendar` | 69ms–1,043ms | **15×/min** | **300×/min** |
| `GET /api/analytics/*` | 70ms–335ms each | 2×/min each | **40×/min each** |

### ⚠️ Cached But Broken — Must Fix
| Issue | Evidence |
|---|---|
| `getBookingById` cache invalidated on every single mutation, then immediately polled | Booking detail polled **11×/min**, cache miss after every verify/update/comment |
| `addPayment` cache invalidation takes **12,149ms** | Re-fetching full data eagerly instead of lazy invalidation |
| Notification cache miss causes all users to hit DB simultaneously | No request deduplication — thundering herd risk at 20 users |
| `/api/sync` runs `Notification.find({ userId })` on every call too | Double DB burden per sync tick |

---

## Fix #1 — Cache `/api/sync` Response

### Evidence
```
[MONGOOSE SLOW] Booking.find - 11414ms | filter: {}      ← from /api/sync
[MONGOOSE SLOW] Notification.find - 506ms | filter: {"userId":"..."} ← also from /api/sync
GET /api/sync — 11418ms
[POLL RATE] "/api/sync": 2   ← 2×/min per user = 40×/min at 20 users
```
`/api/sync` hits DB on every call with no caching whatsoever. At 20 users that is 40 full Booking collection scans per minute.

### Implementation

```typescript
// In syncController.ts

export const syncData = async (req, res) => {
  const userId = req.user._id.toString();
  const cacheKey = `sync_${userId}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Fetch with a filter — do NOT use Booking.find({})
  // Only fetch what sync actually needs (recent/active bookings)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
  const [bookings, notifications] = await Promise.all([
    Booking.find({ updatedAt: { $gte: since } })
      .select('_id status updatedAt assignedToUserId') // only fields sync needs
      .limit(200)
      .lean(),
    Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const payload = { bookings, notifications, syncedAt: new Date() };

  // Cache for 30 seconds — short enough to feel real-time, long enough to absorb poll pressure
  await cache.set(cacheKey, payload, 30);

  res.json(payload);
};
```

### Invalidation
```typescript
// Call this whenever a booking is mutated or a notification is created
await cache.delete(`sync_${userId}`);
```

---

## Fix #2 — Write-Through Cache for `getBookingById` (Stop Invalidate→Miss→Refetch Cycle)

### Evidence
```
[POLL RATE] "/api/bookings/69fc5a9757331c2809c46796": 11   ← 11 fetches in 60s from ONE user
[PERF] getBookingById — source: 'cache'   0ms   ← HIT
[PERF] getBookingById — source: 'db'    206ms   ← MISS 14 seconds later (after a verify)
[PERF] getBookingById — source: 'db'    185ms   ← MISS again (after an update)
[PERF] getBookingById — source: 'db'    185ms   ← MISS again (after a comment)
```
The booking detail page is polled **11 times per minute per user**. Every mutation (verify, update, status change, add comment) invalidates the cache, and the very next poll hits the DB cold. At 20 users with booking pages open, that is **220 booking fetches per minute**.

### Fix: Switch from Invalidate-Only to Write-Through

Instead of deleting the cache key on mutation and letting the next read rebuild it, **write the updated data directly into the cache** after every mutation.

```typescript
// src/utils/bookingCache.ts — shared helper

export async function refreshBookingCache(bookingId: string) {
  const booking = await Booking.findById(bookingId)
    .populate('passengers')
    .populate('payments')
    .populate('timeline')
    .lean();

  if (booking) {
    // Write-through: cache is always warm, never cold after a mutation
    await cache.set(`booking_${bookingId}`, booking, 60); // 60s TTL
  }
  return booking;
}

export async function invalidateBookingCache(bookingId: string) {
  await cache.delete(`booking_${bookingId}`);
}
```

```typescript
// In every mutation controller — replace cache.delete() with refreshBookingCache()

// updateStatus controller
await Booking.findByIdAndUpdate(id, { status });
await refreshBookingCache(id);   // ← write-through: cache is immediately warm
res.json(updatedBooking);

// addPayment controller
await Payment.create(paymentData);
await refreshBookingCache(bookingId);  // ← no more 12s cacheInvalidation
res.json(payment);

// addPassengers, verify, updateBooking, addComment — same pattern
```

### Result
The booking cache is **always warm**. The 11 polls per minute per user all hit cache at <1ms. Zero DB hits from polling.

---

## Fix #3 — Fix Thundering Herd on Notification Cache Miss

### Evidence
```
[POLL RATE] "/api/notifications": 6   ← 6×/min per user = 120×/min at 20 users
[MONGOOSE SLOW] Notification.find - 11135ms  ← cache miss, all users hit DB together
[MONGOOSE SLOW] Notification.find -  2579ms  ← another miss seconds later
```
When the notification cache expires, all 20 users who poll simultaneously fire 20 concurrent `Notification.find({ userId })` queries — the "thundering herd" problem. With no index on `userId`, each query does a full collection scan.

### Fix A — Add Jitter to Cache TTL (Spread Expiry Times)

```typescript
// In getNotifications controller

// BEFORE — all users' caches expire at exactly the same time
await cache.set(`notifications_${userId}`, notifications, 30);

// AFTER — add random jitter so expiries are spread out
const jitter = Math.floor(Math.random() * 15); // 0–15 seconds of jitter
await cache.set(`notifications_${userId}`, notifications, 30 + jitter);
```

### Fix B — Request Deduplication (Only One DB Query Per Cache Miss)

```typescript
// src/utils/dedupe.ts

const inFlight = new Map<string, Promise<any>>();

export async function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) {
    return inFlight.get(key)!; // Return the same promise to all concurrent callers
  }
  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
```

```typescript
// In getNotifications controller

const notifications = await dedupe(
  `notifications_db_${userId}`,
  () => Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
);
```

Now if 20 users all hit a cache miss at the same moment, only **one** DB query runs. The other 19 wait for the same promise to resolve.

---

## Fix #4 — Cache the Calendar Endpoint

### Evidence
```
[POLL RATE] "/api/bookings/calendar": 15   ← 15 calendar requests in 60 seconds (1 user!)
[MONGOOSE SLOW] Booking.find - 206ms | filter: {"travelDate":{"$gte":...}}   ← May
[MONGOOSE SLOW] Booking.find - 1043ms | filter: {"travelDate":{"$gte":...}}  ← June
```
The calendar view fetches bookings for multiple months on load and every navigation. With 15 requests per minute from one user and no cache, this will become 300 requests per minute at 20 users.

Calendar data for a given month changes rarely — booking travel dates are not updated every second. A 5-minute cache is completely safe.

### Implementation

```typescript
// In calendarController.ts (or equivalent)

export const getCalendarBookings = async (req, res) => {
  const { month, year } = req.query;
  const cacheKey = `calendar_${year}_${month}`;  // Shared across all users — same data

  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const bookings = await Booking.find({
    travelDate: { $gte: start, $lte: end }
  })
    .select('_id travelDate status assignedToUserId customerName') // only fields calendar needs
    .lean();

  // 5-minute TTL — calendar data doesn't change second-to-second
  await cache.set(cacheKey, bookings, 300);

  res.json(bookings);
};
```

### Invalidation
```typescript
// When a booking's travelDate is updated, invalidate the affected months:
const oldMonth = `calendar_${oldDate.getFullYear()}_${oldDate.getMonth() + 1}`;
const newMonth = `calendar_${newDate.getFullYear()}_${newDate.getMonth() + 1}`;
await Promise.all([
  cache.delete(oldMonth),
  cache.delete(newMonth),
]);
```

---

## Fix #5 — Cache Analytics Endpoints

### Evidence
```
GET /api/analytics/revenue-trends   200 - 70ms
GET /api/analytics/bookings         200 - 70ms
GET /api/analytics/payment-breakdown 200 - 255ms
GET /api/analytics/payments         200 - 335ms
GET /api/analytics/agents           304 - 89ms

[POLL RATE] "/api/analytics/bookings": 2
            "/api/analytics/revenue-trends": 2
            "/api/analytics/payment-breakdown": 2
            "/api/analytics/payments": 2
            "/api/analytics/agents": 2
```
5 analytics endpoints × 2×/min per user = 10 analytics DB queries/min per user = **200 queries/min at 20 users**. Analytics data is aggregated — nobody needs it refreshed more than once per 10 minutes.

### Implementation

```typescript
// Wrap each analytics controller with a cache check

export const getRevenueAnalytics = async (req, res) => {
  const { fromDate, toDate, interval, company } = req.query;
  const cacheKey = `analytics_revenue_${fromDate}_${toDate}_${interval}_${company}`;

  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const data = await runRevenueAggregation(fromDate, toDate, interval, company);

  // 10-minute TTL — analytics data is slow-changing
  await cache.set(cacheKey, data, 600);
  res.json(data);
};
```

Apply the same pattern to: `getBookingAnalytics`, `getPaymentBreakdown`, `getPaymentAnalytics`, `getAgentAnalytics`.

### Invalidation
Analytics caches can expire naturally — no need to invalidate on mutations. The 10-minute TTL means they're always within 10 minutes of accurate.

---

## Fix #6 — Surgical Cache Invalidation (Stop Invalidating Everything)

### Evidence
```
[PERF] addPayment — cacheInvalidation: 12149ms
[PERF] updateStatus — cacheInvalidation: 73ms
```
Right now, mutations seem to invalidate too broadly — wiping list caches, re-fetching eagerly, or invalidating keys that don't need to change. Every invalidation that isn't lazy (invalidate-only) becomes a hidden DB fetch.

### Rule: Only Invalidate What Actually Changed

```typescript
// WRONG — invalidates everything booking-related
async function invalidateAfterPaymentAdd(bookingId: string) {
  await cache.delete(`booking_${bookingId}`);
  await cache.delete(`bookings_all_page_1`);        // ← unnecessary
  await cache.delete(`bookings_status_Booked`);     // ← unnecessary unless status changed
  await cache.delete(`sync_${userId}`);             // ← unnecessary for a payment
  const fresh = await getBookingById(bookingId);    // ← NEVER re-fetch eagerly
  await cache.set(`booking_${bookingId}`, fresh);   // ← 12s of unnecessary work
}

// CORRECT — surgical invalidation, write-through only on what changed
async function invalidateAfterPaymentAdd(bookingId: string, userId: string) {
  // Use write-through (see Fix #2) — refresh booking cache directly
  await refreshBookingCache(bookingId);

  // Invalidate sync so next poll gets fresh data
  await cache.delete(`sync_${userId}`);

  // Do NOT invalidate booking list caches — a payment addition
  // doesn't change which bookings appear in any list view
}
```

### Cache Invalidation Matrix
Use this table to decide what to invalidate after each mutation:

| Mutation | Invalidate `booking_id` | Invalidate `bookings_list` | Invalidate `sync` | Invalidate `calendar` |
|---|---|---|---|---|
| Add/delete payment | ✅ (write-through) | ❌ | ✅ | ❌ |
| Add/delete passenger | ✅ (write-through) | ❌ | ✅ | ❌ |
| Update status | ✅ (write-through) | ✅ (status filter changed) | ✅ | ❌ |
| Update booking (travelDate) | ✅ (write-through) | ✅ | ✅ | ✅ (old+new month) |
| Update booking (other fields) | ✅ (write-through) | ❌ | ✅ | ❌ |
| Add comment | ✅ (write-through) | ❌ | ❌ | ❌ |
| Verify booking | ✅ (write-through) | ❌ | ✅ | ❌ |
| Delete booking | ✅ (delete key) | ✅ | ✅ | ✅ |

---

## Fix #7 — Use Shared Cache Keys for Non-User-Specific Data

### Evidence
```
GET /api/bookings?page=1&limit=15 — same 15 bookings returned to every user
[POLL RATE] "/api/bookings": 8  ← 8×/min per user = 160×/min at 20 users
```
The all-bookings list (no user filter) returns identical data to every user. Currently each user may have their own cache key. It should be a **single shared key**.

### Implementation

```typescript
// In getBookings controller — distinguish user-specific from shared queries

function buildCacheKey(filters, page, limit) {
  const isUserSpecific = filters.myBookings || filters.assignedTo || filters.createdBy;

  if (isUserSpecific) {
    // User-specific — cache per user
    return `bookings_${userId}_${JSON.stringify(filters)}_${page}_${limit}`;
  } else {
    // Shared — same cache for all users (all-bookings, status filter, etc.)
    return `bookings_shared_${JSON.stringify(filters)}_${page}_${limit}`;
  }
}
```

This means 20 users browsing the same booking list share one cache entry instead of creating 20 identical cache entries, each requiring its own DB query to populate.

---

## Impact Projection at 20 Users

| Problem | DB Queries/min Now | DB Queries/min After Fixes |
|---|---|---|
| `/api/sync` (no cache) | 40 (20 users × 2) | ~2 (cache miss ~every 30s, shared) |
| `/api/bookings/calendar` (no cache) | 300 (20 users × 15) | ~3 (per month, 5min TTL) |
| Analytics (no cache) | 200 (20 users × 10) | ~5 (10min TTL) |
| Booking detail polling (invalidate-only) | 220 (20 users × 11) | ~0 (write-through, always cached) |
| Notifications (thundering herd) | Burst of 20 on every expiry | 1 (deduplication) |
| **Total** | **~780 queries/min** | **~11 queries/min** |

---

## Implementation Checklist for Coding Agent

**Fix #1 — `/api/sync` caching**
- [ ] Add 30s TTL cache to `/api/sync` with per-user key
- [ ] Replace `Booking.find({})` in sync with filtered + `.select()` + `.limit()` query
- [ ] Run `Booking.find` and `Notification.find` in `Promise.all` (parallel, not sequential)
- [ ] Invalidate `sync_userId` cache on any booking mutation or notification creation

**Fix #2 — Write-through booking cache**
- [ ] Create `src/utils/bookingCache.ts` with `refreshBookingCache(bookingId)` helper
- [ ] Replace all `cache.delete(booking_id)` calls with `refreshBookingCache(bookingId)`
- [ ] Apply to: `addPayment`, `deletePayment`, `addPassengers`, `updatePassengers`, `updateStatus`, `updateBooking`, `addComment`, `verifyBooking`

**Fix #3 — Thundering herd prevention**
- [ ] Create `src/utils/dedupe.ts` with the `dedupe()` helper
- [ ] Wrap `Notification.find` in `getNotifications` with `dedupe()`
- [ ] Add jitter (0–15s random) to notification cache TTL

**Fix #4 — Calendar caching**
- [ ] Add 5-minute cache to `getCalendarBookings` with key `calendar_year_month`
- [ ] Use shared cache key (not per-user — same data for everyone)
- [ ] Invalidate on booking travelDate update (old month + new month)

**Fix #5 — Analytics caching**
- [ ] Add 10-minute cache to all 5 analytics endpoints
- [ ] Cache key must include all query params (fromDate, toDate, interval, company)
- [ ] No active invalidation needed — let TTL expire naturally

**Fix #6 — Surgical invalidation**
- [ ] Audit every mutation controller and apply the invalidation matrix above
- [ ] Remove any eager re-fetch from cache invalidation code
- [ ] Remove invalidation of list caches from mutation types that don't affect list membership

**Fix #7 — Shared cache keys**
- [ ] Update `buildCacheKey` in `getBookings` to use shared keys for non-user-specific queries
- [ ] Verify with logs that `/api/bookings?page=1&limit=15` shows `[CACHE HIT]` for all users after first fetch
