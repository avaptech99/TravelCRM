# Response Time Analysis Report
**Service:** `travelcrm-2-0.onrender.com`  
**Log Date:** 2026-05-08 | 04:57 UTC → 05:55 UTC (~1 hour session)  
**Backend:** Node.js / Express | **Database:** MongoDB Atlas | **Host:** Render.com  

---

## 1. Executive Summary

The API is experiencing **severe and unpredictable response times** ranging from under **1ms** (cached) to over **36,000ms** (36 seconds) for the same endpoints. The root cause is a combination of **missing database indexes**, **a single-process server (WEB_CONCURRENCY=1)**, **N+1 query patterns**, and **MongoDB Atlas shared-tier latency**. The system is technically functional but operationally unacceptable for production use.

---

## 2. Response Times — Categorised Highest to Lowest

### 🔴 CRITICAL — Above 20,000ms (20+ seconds)

| Endpoint | Response Time | Notes |
|---|---|---|
| `GET /api/notifications` | **36,845ms** | Queued behind other slow requests |
| `GET /api/bookings/:id` (single booking) | **33,999ms** | Full populate chain with no index |
| `GET /api/users/agents` | **28,685ms** | Blocked by concurrent heavy queries |
| `GET /api/analytics/payment-breakdown` | **26,754ms** | Full table scan, no filter index |
| `GET /api/analytics/payments` | **26,322ms** | Full table scan, no filter index |
| `PATCH /api/bookings/:id/verify` | **24,700ms** | Write + re-fetch, no caching |
| `GET /api/bookings/:id` | **23,101ms** | N+1 queries: 5 separate DB calls |
| `GET /api/sync` | **23,001ms** | Full `updatedAt` scan, no index |
| `GET /api/bookings?assignedTo=...&page=4` | **21,483ms** | No compound index on assignedToUserId |
| `GET /api/analytics/agents` | **20,102ms** | No result caching on analytics |
| `GET /api/analytics/bookings` | **20,097ms** | No result caching on analytics |
| `GET /api/analytics/revenue-trends` | **20,077ms** | No result caching on analytics |
| `PATCH /api/bookings/:id/verify` | **20,555ms** | Inconsistent: same endpoint, 145ms other times |

---

### 🟠 VERY HIGH — 10,000ms – 20,000ms

| Endpoint | Response Time | Notes |
|---|---|---|
| `GET /api/bookings/:id` (single booking) | **19,693ms** | `Booking.findOne` alone took 19,692ms |
| `GET /api/bookings?assignedTo=...` | **18,455ms** | Large agent assignment, no index |
| `POST /api/bookings/:id/payments` | **17,821ms** | Write + notification chain |
| `GET /api/bookings?status=Sent&page=36` | **16,000ms** | Deep pagination without cursor |
| `GET /api/bookings/:id` | **16,677ms** | `Booking.findOne` — full collection scan |
| `GET /api/bookings/:id` | **15,598ms** | First fetch after restart (cold) |
| `POST /api/bookings/:id/payments` | **15,840ms** | Second payment POST, still 15s+ |
| `PUT /api/bookings/:id` | **16,633ms** | Update + refetch chain |
| `GET /api/notifications` | **13,960ms** | Blocked behind analytics queries |
| `PUT /api/bookings/:id/passengers` | **12,410ms** | No index on bookingId in Passenger |
| `GET /api/notifications` | **12,932ms** | Notification.find scan on userId |
| `GET /api/bookings?assignedTo=...` | **10,965ms** | Agent filter, no index |
| `GET /api/bookings/:id` | **10,565ms** | Cold fetch, no cache |
| `GET /api/notifications` | **10,024ms** | Blocked by concurrent DB ops |
| `GET /api/bookings?status=Sent&page=18` | **10,336ms** | Skip-based deep pagination |

---

### 🟡 HIGH — 5,000ms – 10,000ms

| Endpoint | Response Time | Notes |
|---|---|---|
| `GET /api/bookings/calendar?month=5&year=2026` | **8,339ms** | May has many bookings — no travelDate index |
| `GET /api/bookings?status=Not+Interested` | **7,663ms** | No index on `status` field |
| `GET /api/bookings?group=Ticketing+INT` | **6,992ms** | No index on `group` field |
| `GET /api/bookings/:id` | **7,358ms** | N+1 populate, cold |
| `GET /api/bookings?myBookings=true` | **9,566ms** | No compound index on assignedToUserId |
| `GET /api/bookings?assignedTo=...&page=8` | **5,394ms** | Deep page + agent filter |

---

### 🟠 ELEVATED — 2,000ms – 5,000ms

| Endpoint | Response Time | Notes |
|---|---|---|
| `GET /api/bookings/:id` | **4,160ms** | N+1: Timeline 1674ms + others |
| `GET /api/bookings?assignedTo=...` | **4,578ms** | Large agent workload, no index |
| `GET /api/bookings?status=Follow+Up` | **3,284ms** | Status filter without index |
| `GET /api/bookings?assignedTo=...` (multi) | **3,679ms / 3,407ms** | Multi-agent filter |
| `GET /api/bookings/calendar?month=1&year=2026` | **3,596ms** | January has high booking volume |
| `GET /api/bookings?outstandingOnly=true` | **2,944ms** (page 2) | `outstanding > 0` — no index |
| `GET /api/bookings?assignedTo=unassigned` | **2,944ms** | Null userId filter |
| `GET /api/notifications` | **2,449ms** | Notification.find on userId, no index |
| `GET /api/analytics/payment-breakdown` (3-month) | **2,557ms** | Still slow even with smaller range |
| `GET /api/users` | **2,205ms** | `User.find({})` full scan — 14 users |
| `GET /api/bookings/:id` | **2,169ms** | Better, but still N+1 |
| `GET /api/analytics/bookings` (3-month) | **2,300ms** | Repeated analytics call, no cache |

---

### 🟢 NORMAL — 100ms – 500ms

| Endpoint | Response Time | Notes |
|---|---|---|
| `GET /api/bookings?page=1&limit=15` | **~135–183ms** | Acceptable but still slow for list |
| `GET /api/bookings/:id` (warm) | **~197–230ms** | After cold fetch, repeat is fine |
| `GET /api/bookings?status=Booked` (page 1) | **133ms** | Filtered, small result |
| `GET /api/bookings/calendar?month=6,7,8...` | **68–137ms** | Months with fewer bookings |
| `GET /api/analytics/payments` (filtered by company) | **132–142ms** | Company-scoped = smaller data |
| `PUT /api/bookings/:id` | **198–201ms** | Write op, acceptable |
| `POST /api/bookings` | **1,267ms** | New booking creation |

---

### ✅ FAST — Under 100ms (Cached or Trivial)

| Endpoint | Response Time | Notes |
|---|---|---|
| `GET /` (health ping) | **0.15–0.32ms** | Static response |
| `GET /api/notifications` (cached) | **0–1ms** | Cache hit |
| `GET /api/settings/dropdowns` (cached) | **0.5–1ms** | Cache hit |
| `GET /api/bookings/:id` (cached) | **0.9ms** | Cache hit, very effective |
| `GET /api/users/agents` (cached) | **0.6–0.8ms** | Cache hit |
| `GET /api/analytics/...` (company-filtered, warm) | **64–75ms** | Smaller dataset |

---

## 3. Why Is Response Time So High?

### 3.1 Missing MongoDB Indexes — Primary Cause

The logs show `[MONGOOSE SLOW]` on virtually every query. MongoDB is doing **full collection scans** (COLLSCAN) instead of using indexes (IXSCAN). With 613+ bookings and growing:

- `Booking.find({})` — no filter, no index used, takes **135–884ms** and climbs
- `Booking.find({ status: "Sent" })` — no index on `status`, causes **13,878ms** for page=1
- `Booking.find({ outstanding: { $gt: 0 } })` — no index on `outstanding`, causes **20,044ms**
- `Booking.find({ travelDate: { $gte: ... } })` — no index on `travelDate`, causes **8,338ms** for busy months
- `Booking.findOne({ _id: ... })` — even `_id` lookups with `populate()` take **16,000–19,692ms** because sub-collections (Timeline, Payment, Passenger) have no `bookingId` index

### 3.2 WEB_CONCURRENCY=1 — Request Queuing

```
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
```

The server runs a **single Node.js process**. While Node.js is non-blocking for I/O, the event loop still queues callbacks. When MongoDB takes 20+ seconds to respond to one query, **all other incoming requests pile up behind it**. This is why `GET /api/notifications` — normally a sub-1ms cached response — sometimes takes **36,845ms**. It wasn't slow; it was **waiting in line**.

### 3.3 N+1 Query Pattern on Single Booking Fetches

Every `GET /api/bookings/:id` fires **5–6 separate sequential database queries**:

```
Booking.findOne()       → 1,045ms – 19,692ms
Timeline.find()         → 301ms – 6,486ms
Payment.find()          → 413ms – 6,485ms
Passenger.find()        → 414ms – 6,486ms
User.find() × 2         → 302ms – 6,490ms each
```

These are **not parallelised**. Total: can exceed 30 seconds. Each sub-query is itself slow due to missing indexes on `bookingId` in Timeline, Payment, and Passenger collections.

### 3.4 Skip-Based Deep Pagination

Queries like `?page=36&limit=15` use MongoDB's `.skip(525).limit(15)`. MongoDB must **read and discard 525 documents** before returning 15. This is why page=36 takes **16,000ms** but page=1 takes **136ms** — it's scanning more of the collection every time you go deeper.

### 3.5 Analytics Endpoints — No Caching, Expensive Aggregations

Analytics endpoints (`/api/analytics/payments`, `/api/analytics/revenue-trends`) with an **empty company filter** scan the entire bookings collection:

- First call with no company filter: **26,754ms**
- Same call immediately after: **0.5ms** (cached)
- But **any change in date range** busts the cache → full rescan

The result is wildly inconsistent behaviour depending on whether the cache key happens to match.

### 3.6 MongoDB Atlas Network Latency

The server is on Render's infrastructure; MongoDB is on Atlas (`ac-nvjnavm-shard-00-00.31xmkrx.mongodb.net`). Every query crosses a **network boundary**. Normally ~5–20ms latency per round trip. With 5–6 round trips per booking fetch and no parallelism, latency compounds severely. Atlas free/shared tiers also have **shared CPU resources**, causing unpredictable spikes.

---

## 4. Why Is Response Time Inconsistent?

The same endpoint can return in 0ms or 36,000ms. Here's exactly why:

| Reason | Example |
|---|---|
| **Cache hit vs miss** | `/api/notifications`: 0ms (cached) vs 36,845ms (cold or cache expired) |
| **Data volume per month/status** | Calendar month=5 (busy): 8,338ms vs month=7 (quiet): 69ms |
| **Request queuing behind slow ops** | `/api/notifications` blocked 36s behind analytics queries |
| **MongoDB Atlas shared-tier variability** | Same query: 19,692ms at 05:25, then 200ms at 05:38 |
| **Skip position (deep pagination)** | Page 1: 136ms → Page 36: 16,000ms |
| **Connection pool saturation** | Concurrent requests exhaust pool → new requests wait |
| **500 errors at exactly ~3001ms** | MongoDB socket timeout hitting a hardcoded 3s limit |
| **Heap pressure** | Heap grows 36MB→42MB during heavy ops, GC pauses affect timing |

---

## 5. Root Cause Summary

```
┌─────────────────────────────────────────────────────────┐
│  ROOT CAUSE #1: Missing MongoDB Indexes                 │
│  Every major collection field queried has no index.     │
│  MongoDB does full collection scans. As data grows,     │
│  this gets exponentially worse.                         │
├─────────────────────────────────────────────────────────┤
│  ROOT CAUSE #2: Single Worker Process (WEB_CONCURRENCY=1)│
│  One slow query blocks all others. The server cannot    │
│  process requests in parallel.                          │
├─────────────────────────────────────────────────────────┤
│  ROOT CAUSE #3: N+1 Queries (No Aggregation)            │
│  5–6 sequential DB calls per booking detail fetch.      │
│  No parallel execution. Each compounds the above.       │
├─────────────────────────────────────────────────────────┤
│  ROOT CAUSE #4: Skip-Based Pagination                   │
│  Deep pages scan the entire collection prefix.          │
│  Gets slower the deeper you paginate.                   │
├─────────────────────────────────────────────────────────┤
│  ROOT CAUSE #5: No Caching on Analytics / Heavy Reads   │
│  Analytics run full aggregations on every request       │
│  unless exact cache key matches.                        │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Where to Look and How to Fix It

### Fix 1 — Add MongoDB Indexes (Highest Impact, Do First)

**Go to:** MongoDB Atlas → Your Cluster → Collections → Indexes tab  
**Or use:** Atlas Performance Advisor → it will auto-suggest missing indexes based on your query patterns

Add these indexes immediately:

```javascript
// Bookings collection
db.bookings.createIndex({ status: 1, createdAt: -1 })
db.bookings.createIndex({ assignedToUserId: 1, createdAt: -1 })
db.bookings.createIndex({ travelDate: 1 })
db.bookings.createIndex({ outstanding: 1 })
db.bookings.createIndex({ group: 1 })
db.bookings.createIndex({ updatedAt: -1 })  // for /api/sync

// Sub-collections — critical for booking detail fetch speed
db.timelines.createIndex({ bookingId: 1 })
db.payments.createIndex({ bookingId: 1 })
db.passengers.createIndex({ bookingId: 1 })

// Notifications
db.notifications.createIndex({ userId: 1, createdAt: -1 })
```

**Expected impact:** Single booking fetch drops from 19,000ms → under 100ms. List queries drop from 8,000ms → under 50ms.

---

### Fix 2 — Parallelise Sub-Queries in `getBookingById`

**Go to:** `src/controllers/bookings.controller.ts` (or equivalent) → `getBookingById` function

Replace sequential awaits with `Promise.all`:

```javascript
// BEFORE (sequential — adds all latencies together)
const booking = await Booking.findOne({ _id: id });
const timeline = await Timeline.find({ bookingId: id });
const payments = await Payment.find({ bookingId: id });
const passengers = await Passenger.find({ bookingId: id });

// AFTER (parallel — only as slow as the slowest single query)
const [booking, timeline, payments, passengers] = await Promise.all([
  Booking.findOne({ _id: id }),
  Timeline.find({ bookingId: id }),
  Payment.find({ bookingId: id }),
  Passenger.find({ bookingId: id }),
]);
```

**Expected impact:** Booking detail fetch drops from 20,000ms → 200–400ms (with indexes in place).

---

### Fix 3 — Replace Skip Pagination with Cursor-Based Pagination

**Go to:** `src/controllers/bookings.controller.ts` → `getBookings` function

```javascript
// BEFORE (slow — scans N documents to skip them)
const bookings = await Booking.find(filter).skip((page - 1) * limit).limit(limit);

// AFTER (fast — uses _id as cursor, O(log n) with index)
const bookings = await Booking.find({
  ...filter,
  ...(cursor ? { _id: { $lt: cursor } } : {})
}).sort({ _id: -1 }).limit(limit);
```

**Expected impact:** Page 36 drops from 16,000ms → same as page 1 (~50ms).

---

### Fix 4 — Increase WEB_CONCURRENCY on Render

**Go to:** Render Dashboard → Your Service → Environment → Add/Edit Environment Variables

```
WEB_CONCURRENCY=4
```

Or use clustering in your `server.js`:

```javascript
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  for (let i = 0; i < cpuCount; i++) cluster.fork();
} else {
  startServer();
}
```

**Expected impact:** Eliminates request queuing. `/api/notifications` stops being blocked by analytics queries.

---

### Fix 5 — Cache Analytics Results with TTL

**Go to:** `src/controllers/analytics.controller.ts`

Analytics data does not change second-by-second. Cache it for 5–10 minutes:

```javascript
const cacheKey = `analytics:${type}:${fromDate}:${toDate}:${company}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await runExpensiveAnalyticsQuery();
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
return result;
```

**Expected impact:** Repeat analytics calls drop from 20,000–26,000ms → 0ms.

---

### Fix 6 — Upgrade MongoDB Atlas Tier

**Go to:** MongoDB Atlas → Your Project → Cluster → Modify

Upgrade from **M0 (Free/Shared)** to at least **M10 (Dedicated)**. Shared tiers have unpredictable CPU and IOPS that cause the random spikes visible in your logs — the same query taking 200ms one minute and 19,000ms the next.

---

### Fix 7 — Fix the 3-Second Timeout Causing 500 Errors

**Go to:** Your Mongoose connection config (likely `src/config/database.ts`)

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  socketTimeoutMS: 30000,   // was likely 3000, causing 500s at exactly 3001ms
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
});
```

The 500 errors on `GET /api/bookings?assignedTo=...` at exactly `3001ms` indicate a hardcoded 3-second socket timeout. The query wasn't failing — it was being killed prematurely.

---

## 7. Priority Fix Order

| Priority | Fix | Effort | Impact |
|---|---|---|---|
| **1** | Add MongoDB indexes | Low (30 min) | 🔥 Massive |
| **2** | Parallelise sub-queries in getBookingById | Medium (2 hrs) | 🔥 Massive |
| **3** | Increase WEB_CONCURRENCY | Low (5 min) | High |
| **4** | Fix socket timeout (stop 500 errors) | Low (10 min) | High |
| **5** | Cursor-based pagination | Medium (3 hrs) | High |
| **6** | Cache analytics with TTL | Medium (2 hrs) | Medium |
| **7** | Upgrade Atlas tier | Low (config) | Medium |

---

*Report generated from Render.com production logs — 2026-05-08 session (~1 hour)*
