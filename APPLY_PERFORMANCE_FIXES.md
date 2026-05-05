# 🛠️ APPLY PERFORMANCE FIXES — Travel CRM Backend
## Instructions for IDE AI (Cursor / Copilot / Windsurf)

---

## WHO YOU ARE & WHAT TO DO

You are a senior backend engineer. Your job is to apply **5 specific, pre-analysed
performance fixes** to this codebase. Every fix is described precisely below with
the exact pattern to find and the exact replacement to make.

**Rules:**
- Read the relevant file before editing it
- Apply the fix exactly as described — do not refactor beyond the scope of each fix
- After each fix, confirm which file and function you edited
- Do NOT ask for permission — apply all 5 fixes in sequence

---

## CONTEXT (read this first)

**Stack:** Node.js + Express + TypeScript + MongoDB (Mongoose v8) + node-cache  
**Deployment:** Render free tier + MongoDB Atlas M0  
**Problem:** After fixing the original 33s regression, 3 new issues remain visible in logs:
- `/api/analytics/*` endpoints take 10–20s (no caching)
- `status=Follow Up` bookings filter takes 25s (missing index)
- `/api/notifications` spikes to 29s intermittently (cache stampede)

**Files already known to exist:**
- `src/utils/cache.ts` — exports a `node-cache` instance (already in use elsewhere)
- `src/controllers/analyticsController.ts` — analytics route handlers
- `src/controllers/notificationController.ts` — notifications handler
- `src/models/Booking.ts` — Mongoose schema with existing indexes

---

## FIX 1 — Add a standalone `status` index to the Booking model

### Why
The existing compound index is `assignedToUserId_1_status_1_lastInteractionAt_-1`.
MongoDB can only use this index when the query includes `assignedToUserId` as the
leading field. A query like `find({ status: 'Follow Up' })` triggers a full
collection scan (~25,000ms on M0).

### What to do

1. Open `src/models/Booking.ts`
2. Find the block where schema indexes are defined (look for `BookingSchema.index(` calls)
3. Add this line immediately after the existing index definitions:

```typescript
BookingSchema.index({ status: 1, lastInteractionAt: -1 });
```

4. Verify `syncIndexes()` is called on DB connection (it should be — audit report
   confirmed this). The new index will be created automatically on next deploy.

### Also run this in MongoDB Atlas UI (Query > Shell) for immediate effect:
```javascript
db.bookings.createIndex({ status: 1, lastInteractionAt: -1 }, { background: true })
```

### Verification
After applying, search the file for all `BookingSchema.index(` calls and confirm
there are now at least these two:
- The original compound index (assignedToUserId + status + lastInteractionAt)
- The new standalone: `{ status: 1, lastInteractionAt: -1 }`

---

## FIX 2 — Add caching to all analytics route handlers

### Why
Logs show 8 analytics endpoints firing simultaneously, each holding a MongoDB
connection for 10–20 seconds. These are aggregation queries on historical data
that does not change second-to-second. `node-cache` is already in the project
but analytics controllers have zero caching.

### What to do

1. Open `src/controllers/analyticsController.ts`
2. At the top of the file, confirm the cache import exists. If not, add it:

```typescript
import cache from '../utils/cache'; // adjust path if needed
```

3. Find **every exported handler function** in this file. They will look like:
```typescript
export const getBookingAnalytics = async (req: Request, res: Response) => {
  // ... builds a query/pipeline and calls Booking.aggregate or similar
};
```

4. For **each handler**, wrap the DB call with a cache check using this exact pattern:

```typescript
export const getBookingAnalytics = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, companyName = '' } = req.query;

    // ✅ ADD: Build a cache key from the query params that make this result unique
    const cacheKey = `analytics_bookings_${fromDate}_${toDate}_${companyName}`;

    // ✅ ADD: Return cached result if available
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return res.status(200).json(cached);
    }

    // existing aggregation code stays here, unchanged
    const data = await Booking.aggregate([...]);

    // ✅ ADD: Store result in cache before returning (300 = 5 minutes TTL)
    cache.set(cacheKey, data, 300);

    return res.status(200).json(data);
  } catch (err) {
    // existing error handling
  }
};
```

### Cache key naming convention — use these keys for each handler:

| Handler function name (approximate) | Cache key pattern |
|---|---|
| bookings analytics / booking stats | `analytics_bookings_${fromDate}_${toDate}_${companyName}` |
| revenue trends | `analytics_revenue_${interval}_${companyName}` |
| agent performance | `analytics_agents_${fromDate}_${toDate}_${companyName}` |
| payments analytics | `analytics_payments_${fromDate}_${toDate}_${companyName}` |
| payment breakdown | `analytics_breakdown_${fromDate}_${toDate}_${companyName}` |

> If there are more handlers than listed here, follow the same pattern:
> `analytics_{descriptiveName}_${...allQueryParams}`

### Verification
After applying, every handler in `analyticsController.ts` must have:
1. A `cacheKey` variable constructed from its query params
2. A `cache.get(cacheKey)` check at the top that returns early if hit
3. A `cache.set(cacheKey, data, 300)` call after the DB result is obtained

---

## FIX 3 — Fix cache stampede on notifications

### Why
Logs show `/api/notifications` alternating between 0.7ms (cache hit) and 29,023ms
(cache miss). When the cache TTL expires and multiple users hit the endpoint
simultaneously, every request fires the DB query at once instead of one refilling
the cache while others wait. This is a cache stampede.

### What to do

1. Open `src/controllers/notificationController.ts`
2. Find the handler for `GET /api/notifications` (likely `getNotifications`)
3. At the **module level** (outside the handler function, at the top of the file),
   add an in-flight request map:

```typescript
// Module-level map — one instance shared across all requests
const inFlight = new Map<string, Promise<any>>();
```

4. Inside the handler, replace the existing cache-check pattern with this:

```typescript
// BEFORE (what it likely looks like now):
const cached = cache.get(cacheKey);
if (cached !== undefined) return res.status(200).json(cached);
const data = await Notification.find({ userId }).lean();
cache.set(cacheKey, data, 60);
return res.status(200).json(data);

// AFTER (single-flight pattern):
const cached = cache.get(cacheKey);
if (cached !== undefined) return res.status(200).json(cached);

// If a DB request is already in-flight for this key, wait for it
if (inFlight.has(cacheKey)) {
  const data = await inFlight.get(cacheKey);
  return res.status(200).json(data);
}

// This is the first request — create the promise and share it
const promise = Notification.find({ userId }).lean(); // keep existing query
inFlight.set(cacheKey, promise);

try {
  const data = await promise;
  cache.set(cacheKey, data, 60); // keep existing TTL
  return res.status(200).json(data);
} finally {
  inFlight.delete(cacheKey); // always clean up
}
```

> Note: The `finally` block is critical — it ensures the key is removed from
> `inFlight` even if the DB query throws an error.

### Verification
After applying:
- `inFlight` Map is declared at module scope (not inside the handler)
- The handler checks `inFlight.has(cacheKey)` before firing a new DB query
- `inFlight.delete(cacheKey)` is inside a `finally` block

---

## FIX 4 — Add early `$match` + `$project` to all analytics aggregation pipelines

### Why
Analytics aggregations that filter by `companyName` or date range mid-pipeline
(after a `$lookup` or `$group`) process the entire collection before filtering.
Moving `$match` to the first stage and `$project` to the second dramatically
reduces the number of documents processed in expensive later stages.

### What to do

1. Stay in `src/controllers/analyticsController.ts`
2. Find every `Booking.aggregate([...])` or `Payment.aggregate([...])` call
3. For each pipeline array, ensure the **first stage is always `$match`** with
   the date range and companyName filter, and the **second stage is `$project`**
   with only the fields actually used later in the pipeline.

```typescript
// BEFORE — filter appears mid-pipeline or is missing:
const pipeline = [
  { $lookup: { from: 'payments', localField: '_id', foreignField: 'bookingId', as: 'payments' } },
  { $group: { _id: '$status', count: { $sum: 1 } } },
  { $match: { companyName, travelDate: { $gte: from, $lte: to } } } // ❌ too late
];

// AFTER — filter first, project early, then aggregate:
const pipeline = [
  // Stage 1: Filter as early as possible — MongoDB uses index here
  {
    $match: {
      travelDate: { $gte: new Date(fromDate as string), $lte: new Date(toDate as string) },
      ...(companyName ? { companyName } : {}),  // skip if empty string
    }
  },
  // Stage 2: Keep only fields needed downstream (reduces memory per doc)
  {
    $project: {
      status: 1,
      amount: 1,
      travelDate: 1,
      assignedToUserId: 1,
      companyName: 1,
      // add only fields actually referenced in later $group/$lookup stages
    }
  },
  // Stage 3+: existing $group, $lookup, $sort etc — leave unchanged
  { $group: { _id: '$status', count: { $sum: 1 } } },
  // ...
];
```

> If `companyName` comes in as an empty string `''` for "all companies",
> use the spread pattern `...(companyName ? { companyName } : {})` so you
> don't accidentally match only documents with `companyName: ''`.

### Verification
After applying, every `aggregate([...])` call in `analyticsController.ts` must
start with `{ $match: { travelDate: ..., ... } }` as its first element.

---

## FIX 5 — Fix deep pagination performance

### Why
Logs show page 1–4 returning in ~200ms but page 10 taking 1,436ms. MongoDB's
`skip((page-1) * limit)` scans and discards `(page-1) × limit` documents before
returning results. This gets exponentially worse at page 20, 50, 100+.

### What to do

1. Open `src/controllers/bookingController.ts`
2. Find the `getBookings` handler (the main paginated listing function)
3. The handler currently accepts `page` and `limit` as query params. Add support
   for an optional `cursor` param alongside the existing `page`/`limit` params.

```typescript
// Read cursor from query (optional — falls back to skip if absent)
const { page = '1', limit = '15', cursor, ...otherFilters } = req.query;
const limitNum = parseInt(limit as string, 10);

// If cursor provided, use cursor-based pagination (fast at any depth)
if (cursor) {
  query.lastInteractionAt = { $lt: new Date(cursor as string) };

  const bookings = await Booking.find(query)
    .sort({ lastInteractionAt: -1 })
    .limit(limitNum)
    .lean();

  const nextCursor = bookings.length === limitNum
    ? bookings[bookings.length - 1].lastInteractionAt?.toISOString()
    : null;

  return res.status(200).json({
    bookings,
    nextCursor, // frontend uses this as ?cursor= on the next request
    hasMore: bookings.length === limitNum,
  });
}

// Fallback: keep existing skip/limit for backwards compat with page param
const pageNum = parseInt(page as string, 10);
const bookings = await Booking.find(query)
  .sort({ lastInteractionAt: -1 })
  .skip((pageNum - 1) * limitNum)
  .limit(limitNum)
  .lean();
```

> Keep the existing `skip/limit` path intact — this is an additive change.
> The frontend can migrate to cursor-based pagination page by page.
> `cursor` takes priority when present; `page` works as before when `cursor`
> is absent.

### Verification
After applying:
- Handler reads `cursor` from `req.query`
- If `cursor` is present, it adds `lastInteractionAt: { $lt: new Date(cursor) }` to the query
- Response includes `nextCursor` (the ISO string of the last document's `lastInteractionAt`)
- Existing `skip/limit` path still works when `cursor` is absent

---

## AFTER ALL FIXES — Verification Checklist

Run through this list to confirm everything was applied correctly:

```
[ ] Booking model has 2+ index definitions including { status: 1, lastInteractionAt: -1 }
[ ] Every handler in analyticsController.ts has cache.get() at top and cache.set() after DB call
[ ] notificationController.ts has inFlight Map at module scope
[ ] notificationController.ts handler uses inFlight.has() before firing DB query
[ ] inFlight.delete() is inside a finally block in notificationController.ts
[ ] Every aggregate() call in analyticsController.ts starts with $match as first stage
[ ] bookingController.ts getBookings handler accepts cursor param
[ ] bookingController.ts cursor path uses lastInteractionAt < cursor instead of skip()
```

---

## EXPECTED RESULTS AFTER FIXES

| Endpoint | Before | After |
|---|---|---|
| `/api/analytics/*` (cached) | 10–20s | < 5ms |
| `/api/analytics/*` (cold) | 10–20s | 2–4s |
| `/api/bookings?status=Follow+Up` | 25s | ~200ms |
| `/api/notifications` (any load) | 0ms–29s | consistently ~60ms |
| `/api/bookings?page=20` | 1,400ms+ | ~200ms (with cursor) |
| `/api/bookings` (standard) | 200ms | 200ms (unchanged) |

---

*Apply fixes 1–3 first — they have the largest and most immediate impact.*  
*Fix 4 compounds Fix 2 (makes cold analytics queries faster before caching kicks in).*  
*Fix 5 is additive and safe to apply last.*
