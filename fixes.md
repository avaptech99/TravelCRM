# Performance Fixes — TravelCRM Backend
**Service:** `travelcrm-2-0.onrender.com`  
**Status after Session 2:** Indexes applied ✅ | Atlas throttling still active ❌ | WEB_CONCURRENCY=1 ❌  

---

## What Was Fixed vs What Is Still Broken

| Fix | Status | Result |
|---|---|---|
| MongoDB indexes added | ✅ Done | Good runs: booking detail 19,000ms → 138ms |
| WEB_CONCURRENCY | ❌ Still 1 | Request queuing continues |
| Atlas M0 free tier | ❌ Still throttling | `_id` lookups taking 4,000–8,000ms |
| `myBookings` OR query | ❌ Not fixed | Still 5,775ms |
| Notification polling | ❌ Not fixed | Still starving other queries |
| Parallel sub-queries | ❌ Not fixed | N+1 pattern still present |
| Skip pagination | ❌ Not fixed | Page 21 = 34,076ms |

---

## Fix 1 — Upgrade MongoDB Atlas to M10 (Do This First Now)
**Priority: CRITICAL | Effort: 5 min | Impact: Fixes ~60% of remaining slowness**

The smoking gun from Session 2 logs:
```
User.find({ _id: { $in: [...] } }) — 4,828ms
User.find({ _id: { $in: [...] } }) — 8,197ms
Error: Server selection timed out after 5000 ms
```
`_id` is MongoDB's primary key — it is **always indexed**, you cannot make it faster with code changes. A 8-second lookup on `_id` is 100% Atlas M0 CPU throttling your shared cluster.

**Steps:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Your Project → Clusters
2. Click **"..."** → **Edit Configuration**
3. Change tier from **M0 (Free/Shared)** to **M10 ($57/month, Dedicated)**
4. Click **Review Changes** → **Apply**
5. Atlas performs a rolling upgrade — no downtime

**Expected result:** `_id` lookups drop from 4,000–8,000ms → under 5ms. All indexed queries become reliably fast, not just on good runs.

---

## Fix 2 — Increase WEB_CONCURRENCY on Render
**Priority: HIGH | Effort: 2 min | Impact: Eliminates request queuing**

Current state — still in every log:
```
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
```
One worker means one slow query blocks every other request. `/api/notifications` hit 25,041ms not because it was slow — it was waiting in line behind other queries.

**Steps:**
1. Go to [Render Dashboard](https://dashboard.render.com) → Your Web Service
2. Click **Environment** tab
3. Add environment variable:
```
WEB_CONCURRENCY = 4
```
4. Click **Save Changes** — Render auto-redeploys

**Or do it properly in `src/server.ts`:**
```typescript
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const workers = parseInt(process.env.WEB_CONCURRENCY || '1');
  for (let i = 0; i < workers; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}
```

**Expected result:** 4 workers process requests in parallel. A 10-second analytics query no longer freezes the entire app.

> ⚠️ Note: With 4 workers × 10 pool size = 40 total MongoDB connections. Keep `maxPoolSize: 10` per worker.

---

## Fix 3 — Restructure the `myBookings` OR Query
**Priority: HIGH | Effort: 1–2 hrs | Impact: 5,775ms → under 100ms**

Current broken query:
```javascript
// This generates an $or which MongoDB handles with two separate index scans + merge
Booking.find({
  $or: [
    { assignedToUserId: userId },
    { createdByUserId: userId }
  ]
})
// Result: 5,775ms — even with indexes on both fields
```

**Fix — add a `participantIds` array field to each Booking document:**

**Step 1 — Update your Booking schema (`src/models/Booking.ts`):**
```typescript
const BookingSchema = new Schema({
  // ... existing fields ...
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }]
});
```

**Step 2 — Populate the field on all existing bookings (run once in MongoDB Atlas shell):**
```javascript
db.bookings.find({}).forEach(booking => {
  const ids = [];
  if (booking.assignedToUserId) ids.push(booking.assignedToUserId);
  if (booking.createdByUserId) ids.push(booking.createdByUserId);
  db.bookings.updateOne(
    { _id: booking._id },
    { $set: { participantIds: ids } }
  );
});
```

**Step 3 — Maintain it going forward (in your create/update booking logic):**
```typescript
// Whenever assignedToUserId or createdByUserId changes, update participantIds
booking.participantIds = [
  booking.assignedToUserId,
  booking.createdByUserId
].filter(Boolean);
```

**Step 4 — Update the query:**
```typescript
// BEFORE
const filter = { $or: [{ assignedToUserId: userId }, { createdByUserId: userId }] };

// AFTER — single index scan, O(log n)
const filter = { participantIds: userId };
```

**Expected result:** `myBookings` drops from 5,775ms → under 100ms.

---

## Fix 4 — Stop Notification Polling from Starving the Database
**Priority: HIGH | Effort: 5 min | Impact: Removes the biggest source of Atlas contention**

Current pattern from logs — notifications polled every 20 seconds, each hitting the DB:
```
Notification.find({ userId }) — 4,926ms
Notification.find({ userId }) — 8,745ms
Notification.find({ userId }) — 10,352ms
Notification.find({ userId }) — 11,528ms
Notification.find({ userId }) — 25,040ms
```
Every user session is hammering `Notification.find` on a 20-second loop. With Atlas throttling, each call can take 10–25 seconds, blocking other queries.

Find the polling code in your frontend (likely a `setInterval` or `useEffect`):
```typescript
// BEFORE
const POLL_INTERVAL = 20_000; // 20 seconds

// AFTER — minimum viable change
const POLL_INTERVAL = 120_000; // 2 minutes
```
**Expected result:** Notification DB hits drop by 6×. Other queries get more breathing room on Atlas.

---

## Fix 5 — Parallelise Sub-Queries in `getBookingById`
**Priority: MEDIUM | Effort: 1 hr | Impact: Booking detail worst-case drops significantly**

Current pattern (still in Session 2 logs):
```
Timeline.find  — 3,857ms  ┐
Payment.find   — 3,241ms  │ Sequential — each waits for the previous
Passenger.find — 3,244ms  │
User.find      — 612ms    ┘
Booking.findOne — 3,857ms TOTAL reported
```

**Fix in your booking controller:**
```typescript
// BEFORE — sequential awaits (slow)
async function getBookingById(id: string) {
  const booking = await Booking.findOne({ _id: id });
  const timeline = await Timeline.find({ bookingId: id });
  const payments = await Payment.find({ bookingId: id });
  const passengers = await Passenger.find({ bookingId: id });
  const user = await User.findOne({ _id: booking.assignedToUserId });
  return formatResponse(booking, timeline, payments, passengers, user);
}

// AFTER — parallel execution (fast)
async function getBookingById(id: string) {
  const booking = await Booking.findOne({ _id: id });

  // Fire all sub-queries simultaneously
  const [timeline, payments, passengers, user] = await Promise.all([
    Timeline.find({ bookingId: id }),
    Payment.find({ bookingId: id }),
    Passenger.find({ bookingId: id }),
    User.findOne({ _id: booking.assignedToUserId }),
  ]);

  return formatResponse(booking, timeline, payments, passengers, user);
}
```

**Expected result:** Booking detail total time = slowest single sub-query, not sum of all.

---

## Fix 6 — Replace Skip Pagination with Cursor-Based Pagination
**Priority: MEDIUM | Effort: 3–4 hrs | Impact: Eliminates deep-page slowness**

Session 2 proof — skip pagination getting worse:
```
page=14  → 5,151ms
page=21  → 34,076ms   ← worse than Session 1
```
MongoDB reads and discards N documents before returning 15. It gets slower the deeper you go, linearly.

**Fix — use the last `_id` as a cursor:**

Backend:
```typescript
// BEFORE
const bookings = await Booking.find(filter)
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });

// AFTER — cursor-based
router.get('/api/bookings', async (req, res) => {
  const { cursor, limit = 15, ...filterParams } = req.query;
  const filter = buildFilter(filterParams);

  if (cursor) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor as string) };
  }

  const bookings = await Booking.find(filter)
    .sort({ _id: -1 })
    .limit(Number(limit) + 1); // fetch one extra to detect hasMore

  const hasMore = bookings.length > limit;
  const results = hasMore ? bookings.slice(0, -1) : bookings;
  const nextCursor = hasMore ? results[results.length - 1]._id : null;

  res.json({ data: results, nextCursor, hasMore });
});
```

Frontend — instead of page numbers, track cursor:
```typescript
const [cursor, setCursor] = useState<string | null>(null);

async function loadMore() {
  const res = await fetch(`/api/bookings?cursor=${cursor}&limit=15`);
  const { data, nextCursor } = await res.json();
  setBookings(prev => [...prev, ...data]);
  setCursor(nextCursor);
}
```

**Expected result:** Every page loads in the same time as page 1 (~100–150ms), regardless of depth.

---

## Fix 7 — Fix the Mongoose Connection Config
**Priority: LOW | Effort: 10 min | Impact: Prevents hard 3s timeout errors**

Session 1 had 500 errors at exactly 3001ms — a hardcoded socket timeout killing valid slow queries.

**In your `src/config/database.ts` (or wherever you call `mongoose.connect`):**
```typescript
await mongoose.connect(process.env.MONGODB_URI!, {
  maxPoolSize: 10,           // 10 per worker, not 50 or 100
  socketTimeoutMS: 30000,    // was likely 3000 — give queries 30s before killing
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
});
```

---

## Remaining Fix Status After All Changes

| Fix | Expected Response Time |
|---|---|
| `GET /api/bookings/:id` | 50–150ms |
| `GET /api/bookings?page=N` (any page) | 50–150ms |
| `GET /api/bookings?myBookings=true` | 50–100ms |
| `GET /api/bookings?assignedTo=unassigned` | 50–100ms |
| `GET /api/notifications` | ~50ms (cached poll, 2-min interval) |
| `GET /api/analytics/*` | 50–200ms (with M10 + existing cache) |
| `GET /api/bookings/calendar` | 50–150ms |
| `POST /api/bookings` | 100–300ms |

---

## Recommended Order of Execution

```
Day 1 (Today)
  1. Upgrade Atlas M10          → 5 min, highest ROI, fixes Atlas throttling
  2. Set WEB_CONCURRENCY=4      → 2 min, stops request queuing

Day 1–2
  3. Fix notification polling   → increase interval to 2 min (5 min)
  4. Fix Mongoose connection config → 10 min, stops 500 errors
  5. Parallelise getBookingById → 1 hr

Day 2–3
  6. Fix myBookings OR query    → 1–2 hrs
  7. Cursor-based pagination    → 3–4 hrs
```

---

*Based on log analysis from 2026-05-08 Sessions 1 & 2 — travelcrm-2-0.onrender.com*
