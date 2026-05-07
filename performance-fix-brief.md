# 🔧 Performance Fix Brief — Confirmed Root Causes
**App:** TravelCRM Backend (Node.js + Mongoose on Render Free Tier)
**Source:** Instrumentation logs from `detail-logs.md`
**Status:** Root causes confirmed. Fix in priority order. Do NOT skip ahead.

---

## ⚠️ Rules Before You Start

- Fix in the exact priority order listed below — #1 and #2 alone may resolve 80% of the slowness
- After each fix, deploy and share the relevant log lines before moving to the next
- Do NOT increase `maxPoolSize` — this was already ruled out as a cause
- Do NOT touch skip-based pagination yet — confirm it is actually slow after fixes #1 and #2 are deployed

---

## Fix #1 — 🔴 bcrypt Cost Factor Is Too High (CRITICAL)

### Evidence
```
[PERF] loginUser — Total: 8718ms | dbQuery: 1ms | bcryptVerify: 8066ms
```
bcrypt took **8 seconds**. bcrypt is CPU-bound and single-threaded in Node.js. While it runs, the **entire event loop is frozen** — no other request can be processed, no DB callbacks can fire, nothing. Every login event causes every other user's request to hang for ~8 seconds. Normal bcrypt should take 100–300ms.

### What to do
1. Find every `bcrypt.hash()` or `bcrypt.genSalt()` call in the codebase
2. Check the `rounds` / cost factor argument
3. **Change it to `10`**

```typescript
// BEFORE (likely what you have — too high)
const hash = await bcrypt.hash(password, 14); // 8000ms
// or
const salt = await bcrypt.genSalt(14);

// AFTER
const hash = await bcrypt.hash(password, 10); // ~100ms
// or
const salt = await bcrypt.genSalt(10);
```

### Verification
After deploying, log in and confirm:
```
[PERF] loginUser — bcryptVerify: ~100ms  ✅
```

---

## Fix #2 — 🔴 `/api/sync` Fetches ALL Bookings With No Filter (CRITICAL)

### Evidence
```
[MONGOOSE SLOW] Booking.find - 11414ms | filter: {}
[MONGOOSE SLOW] Booking.find -   897ms | filter: {}
[MONGOOSE SLOW] Booking.find -   134ms | filter: {}
GET /api/sync — 11418ms

[POLL RATE] "/api/sync": 2   ← called 2 times per minute
```
Every call to `/api/sync` runs `Booking.find({})` — **no filter, no limit** — fetching all 567 bookings. This holds a DB connection for up to 11 seconds and starves every other request waiting for the pool.

### What to do
1. Open the `/api/sync` controller
2. Identify what it does with the booking data it fetches
3. Apply the appropriate fix below:

**Option A — If sync only needs recent/active bookings:**
```typescript
// BEFORE
const bookings = await Booking.find({});

// AFTER — only fetch bookings modified in the last 24 hours
const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
const bookings = await Booking.find({ updatedAt: { $gte: since } }).limit(100);
```

**Option B — If sync only needs a count or summary:**
```typescript
// BEFORE
const bookings = await Booking.find({});
const count = bookings.length;

// AFTER
const count = await Booking.countDocuments({});
```

**Option C — If sync doesn't actually need booking data at all:**
```typescript
// Remove the Booking.find({}) call entirely
```

### Verification
After deploying, confirm `/api/sync` no longer appears in `[MONGOOSE SLOW]` logs and its response time drops to <200ms.

---

## Fix #3 — 🔴 `addPayment` Cache Invalidation Takes 12 Seconds

### Evidence
```
[PERF] addPayment_69fc5a9757331c2809c46796 — Total: 16450ms
  | validate: 0ms
  | insertPayment: 4300ms
  | cacheInvalidation: 12149ms
```
The payment insert itself is slow due to pool contention (fixed by #1 and #2), but then **cache invalidation adds another 12 seconds on top**. Something inside the invalidation step is doing heavy work — likely re-fetching and re-populating full booking data into cache immediately after invalidating it.

### What to do
1. Open the `addPayment` controller/service
2. Find the `cacheInvalidation` step (or equivalent — wherever cache keys are cleared after insert)
3. Answer: is it **invalidating only**, or **invalidating then immediately re-fetching**?

```typescript
// BAD — invalidates then immediately re-fetches (causes 12s delay)
await cache.delete(`booking_${bookingId}`);
const fresh = await getBookingById(bookingId); // heavy populate — do NOT do this here
await cache.set(`booking_${bookingId}`, fresh);

// GOOD — just invalidate, let the next real request repopulate lazily
await cache.delete(`booking_${bookingId}`);
// done — the next GET /api/bookings/:id will repopulate the cache naturally
```

4. Also check: is the invalidation deleting more cache keys than necessary? It should only clear keys directly related to the modified booking — not all booking list caches.

### Verification
After deploying, `addPayment` total time should be <500ms (just the insert + a few cache deletes).

---

## Fix #4 — 🟠 Missing Index on `Notification.userId`

### Evidence
```
[MONGOOSE SLOW] Notification.find - 11135ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744"}
[MONGOOSE SLOW] Notification.find -  2579ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744"}
[MONGOOSE SLOW] Notification.find -   774ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744"}
[MONGOOSE SLOW] Notification.find -   506ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744"}
```
Every notification cache miss does a full collection scan filtered by `userId`. Notifications poll every ~20 seconds, so this is a recurring drain. Without an index, MongoDB scans every notification document for every user.

### What to do
Add a compound index to the Notification schema:

```typescript
// In Notification.ts (Mongoose schema)
NotificationSchema.index({ userId: 1, createdAt: -1 });
```

Or via MongoDB shell:
```
db.notifications.createIndex({ userId: 1, createdAt: -1 })
```

### Verification
After deploying, `Notification.find` should drop to <10ms on cache miss.

---

## Fix #5 — 🟠 Missing Indexes on Booking Collection

### Evidence
```
[MONGOOSE SLOW] Booking.find - 206ms | filter: {"travelDate":{"$gte":...,"$lte":...}}
[MONGOOSE SLOW] Booking.find - 138ms | filter: {"status":"Booked"}
[MONGOOSE SLOW] Booking.find - 897ms | filter: {"$or":[{"assignedToUserId":...},{"createdByUserId":...}]}
[MONGOOSE SLOW] Booking.find - 128ms | filter: {"assignedToUserId":{"$in":[null]}}
```
All common filter patterns — by status, by travel date, by assigned user — are hitting full collection scans. With 567 (and growing) bookings, these will get slower over time.

### What to do
Add these indexes to `Booking.ts`:

```typescript
// In Booking.ts (Mongoose schema)
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ travelDate: 1 });
BookingSchema.index({ assignedToUserId: 1, createdAt: -1 });
BookingSchema.index({ createdByUserId: 1, createdAt: -1 });
```

Also fix this warning from startup logs — the agent added an invalid `_id` index:
```
⚠️ Index sync error: The field 'key' for an _id index must be {_id: 1}, but got { _id: -1 }
```
Find and remove any custom index definition on `_id` in the Booking schema.

### Verification
After deploying, all `Booking.find` queries filtered by status/travelDate/assignedToUserId should drop to <20ms.

---

## Fix #6 — 🟡 PERF Timer Marks Are Placed Before `await` (Misleading Output)

### Evidence
```
[PERF] getBookings       — dbQuery: 0ms        | formatResponse: 14806ms
[PERF] getBookingById    — dbQueryWithPopulate: 0ms | calculateTotals: 14103ms
[PERF] addPayment        — insertPayment: 4300ms  ← this one is correct
```
The `t.mark()` call must be placed **after** the `await`, not before. Otherwise the segment before it captures 0ms and the segment after it captures all the DB time.

### What to do
Audit every `t.mark()` call. The pattern must always be:

```typescript
// WRONG — mark fires before DB call completes
t.mark('dbQuery');
const results = await Booking.find(filter); // ← await is AFTER the mark
t.mark('formatResponse');

// CORRECT — mark fires after DB call completes
const results = await Booking.find(filter); // ← await is BEFORE the mark
t.mark('dbQuery');
// now dbQuery captures the actual DB time
t.mark('formatResponse');
```

Fix this in every controller that shows `dbQuery: 0ms` or `dbQueryWithPopulate: 0ms` alongside a non-zero value in the segment that follows it.

---

## Summary Table

| # | Fix | File(s) | Expected Result |
|---|---|---|---|
| 🔴 1 | Set bcrypt rounds to `10` | `authController.ts` or `authService.ts` | Login: 8718ms → ~200ms. Event loop unblocks. |
| 🔴 2 | Fix `/api/sync` — add filter/limit or remove `Booking.find({})` | `syncController.ts` | sync: 11418ms → <200ms. Pool freed. |
| 🔴 3 | Fix `addPayment` cache invalidation — invalidate only, no re-fetch | `bookingController.ts` / `paymentService.ts` | addPayment: 16450ms → <500ms |
| 🟠 4 | Add index `{ userId: 1, createdAt: -1 }` on Notification | `Notification.ts` | Notification.find: 11135ms → <10ms |
| 🟠 5 | Add 4 compound indexes on Booking, remove invalid `_id: -1` index | `Booking.ts` | All booking queries: <20ms |
| 🟡 6 | Move `t.mark()` calls to after `await` in all controllers | All controllers | Accurate PERF output for future debugging |

---

## After All Fixes — Verification Checklist

- [ ] Login completes in <300ms (`bcryptVerify` ~100ms)
- [ ] `/api/sync` completes in <200ms, no `Booking.find` with `filter: {}` in MONGOOSE SLOW logs
- [ ] `addPayment` completes in <500ms, `cacheInvalidation` <50ms
- [ ] `Notification.find` never appears in MONGOOSE SLOW logs
- [ ] `Booking.find` with status/travelDate/assignedTo filters never appears in MONGOOSE SLOW logs
- [ ] No simultaneous endpoint spikes (confirms pool is no longer saturated)
- [ ] PERF timer breakdown shows non-zero values in the correct segments
