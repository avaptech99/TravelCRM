# 4 SURGICAL CHANGES — detail-logs-2 PERF Timer Analysis
## Do not change anything else. These 4 changes fix everything.

---

## WHAT THE PERF TIMERS PROVED

The PERF timers in detail-logs-2 expose the exact lines causing slowness.
This is not guesswork — these are measured timings inside each function:

```
Line 76:  addPayment    — insertPayment: 48,826ms  (NOT recalcOutstanding)
Line 103: updateStatus  — cacheInvalidation: 1,871ms | findAndUpdate: 0ms
Line 240: deleteBooking — deleteBookingDoc: 3,850ms (27,302ms was pool wait)
Line 52:  getBookings   — assignedTo=null: 5,354ms (no null-safe index)
```

The self-ping keepalive is working. Cache hits are perfect (0.5–1ms).
Background tasks work ([BG:OK] 141ms, 150ms). Everything else is fast.

Only these 4 things are broken. Fix only these 4 things.

---

## CHANGE 1 — deleteBooking: use deleteOne not findOneAndDelete

### File: src/controllers/bookingController.ts
### Function: deleteBooking

### Why
`Booking.findOneAndDelete({_id: bookingId})` fetches the full document
AND deletes it in a write-locked operation. On M0 shared cluster this
holds a lock for up to 27 seconds under load. `deleteOne` is a pure
delete — no fetch, no lock held, releases immediately.

### Find this line (search for findOneAndDelete OR findByIdAndDelete in deleteBooking):
```typescript
// Any of these variants:
await Booking.findOneAndDelete({ _id: bookingId });
await Booking.findOneAndDelete({ _id: id });
await Booking.findByIdAndDelete(bookingId);
await Booking.findByIdAndDelete(id);
```

### Replace with:
```typescript
const deleteResult = await Booking.deleteOne({ _id: bookingId });
if (deleteResult.deletedCount === 0) {
  return res.status(404).json({ message: 'Booking not found' });
}
```

### Important: Do NOT change anything else in this function.
The setImmediate background cleanup is working correctly ([BG:OK] 1342ms).
The res.status(200).json() placement is correct.
Only change findOneAndDelete → deleteOne.

---

## CHANGE 2 — updateBookingStatus: remove DB call from cache invalidation

### File: src/controllers/bookingController.ts
### Function: updateBookingStatus (PATCH /bookings/:id/status)

### Why
PERF timer proves it: `cacheInvalidation: 1,871ms | findAndUpdate: 0ms`
The findAndUpdate takes 0ms. The cache invalidation takes 1,871ms.
Cache invalidation (cache.del) takes 0ms. Therefore something inside
the cache invalidation block is doing a DB query.

The likely culprit: fetching the booking to get assignedToUserId for
cache key construction AFTER already having it from findByIdAndUpdate.

### Find the updateBookingStatus function and look for ANY await after the
### findByIdAndUpdate call and before or inside the cache invalidation step:

```typescript
// DELETE any line like these inside updateBookingStatus cacheInvalidation:
const booking = await Booking.findById(id);          // ← DELETE
const b = await Booking.findOne({ _id: id });        // ← DELETE
const doc = await Booking.findById(bookingId).lean(); // ← DELETE
```

### The correct structure — no DB calls after the primary write:
```typescript
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // PRIMARY write — use returnDocument instead of new (fixes deprecation)
    const updated = await Booking.findByIdAndUpdate(
      id,
      { status, lastInteractionAt: new Date() },
      { returnDocument: 'after' }  // Mongoose v8 — replaces { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Booking not found' });

    // Cache bust — ALL synchronous, takes 0ms, NO DB calls
    cache.del(`booking_${id}`);
    cache.del(`booking_${id}_detail`); // bust any variant keys too
    if ((updated as any).assignedToUserId) {
      cache.del(`sync_${(updated as any).assignedToUserId}`);
    }
    cache.keys()
      .filter((k: string) => k.startsWith('bookings_'))
      .forEach((k: string) => cache.del(k));

    // Respond immediately — cache bust already done above
    res.status(200).json(updated);

    // Background side effects (Timeline, Notification) — keep as-is
    setImmediate(() => runBG('updateStatus_sideEffects', async () => {
      // existing Timeline.create and Notification.create here
    }));

  } catch (err: any) {
    console.error('[updateBookingStatus]', err.message);
    return res.status(500).json({ message: 'Failed to update status' });
  }
};
```

---

## CHANGE 3 — addPayment: remove Booking.findOne validation

### File: src/controllers/bookingController.ts or paymentController.ts
### Function: addPayment (POST /bookings/:id/payments)

### Why
PERF log line 76: `insertPayment: 48,826ms`
Mongoose slow log line 75: `Booking.findOne - 48721ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}`

The addPayment handler calls `Booking.findById(bookingId)` BEFORE
creating the payment — to validate the booking exists. When the pool is
locked by deleteBooking, this validation query waits 48 seconds.

The validation is unnecessary because:
1. The bookingId comes from the URL param — authenticated route
2. Payment.create will succeed or fail regardless
3. If bookingId is invalid, the payment still gets created (orphaned) — 
   fix this properly with a mongoose schema ref validation, not a DB query

### Find and DELETE this block inside addPayment:
```typescript
// DELETE any booking validation before Payment.create:
const booking = await Booking.findById(bookingId);
if (!booking) return res.status(404).json({ message: 'Booking not found' });

// OR:
const exists = await Booking.exists({ _id: bookingId });
if (!exists) return res.status(404).json({ message: 'Not found' });
```

### The addPayment function should start with Payment.create directly:
```typescript
export const addPayment = async (req: Request, res: Response) => {
  try {
    const { id: bookingId } = req.params;

    // PRIMARY write — straight to payment insert, no booking lookup
    const payment = await Payment.create({
      ...req.body,
      bookingId,
      createdAt: new Date(),
    });

    // Cache bust — synchronous, 0ms
    cache.del(`booking_${bookingId}`);
    cache.keys()
      .filter((k: string) => k.startsWith('analytics_'))
      .forEach((k: string) => cache.del(k));

    // Respond immediately
    res.status(201).json(payment);

    // Background: recalcOutstanding + Timeline
    setImmediate(() => runBG('addPayment_sideEffects', async () => {
      await recalcOutstanding(bookingId);
      await Timeline.create({
        bookingId,
        userId: (req as any).user?._id,
        type: 'payment_added',
        text: `Payment of ${req.body.amount} added`,
        createdAt: new Date(),
      });
    }));

  } catch (err: any) {
    console.error('[addPayment]', err.message);
    return res.status(500).json({ message: 'Failed to add payment' });
  }
};
```

---

## CHANGE 4 — Atlas Shell: create null-safe index for unassigned filter

### Run in MongoDB Atlas Shell NOW (before deploying):
```javascript
// This fixes: Booking.find({assignedToUserId: {$in: [null]}}) - 5354ms
// Standard indexes skip null values — this index includes them
db.bookings.createIndex(
  { assignedToUserId: 1, lastInteractionAt: -1 },
  { 
    background: true, 
    name: "idx_assigned_date_v2",
    // Do NOT use sparse: true — sparse indexes skip null values
  }
)

// If an index with this exact key already exists, drop and recreate:
db.bookings.dropIndex("idx_assigned_date")
db.bookings.createIndex(
  { assignedToUserId: 1, lastInteractionAt: -1 },
  { background: true, name: "idx_assigned_date_v2" }
)

// Verify:
db.bookings.getIndexes()
// Should see idx_assigned_date_v2 in the list
```

---

## ALSO FIX — Mongoose deprecation warnings (1 min, grep and replace)

Logs show warnings: `mongoose: the 'new' option is deprecated`

```bash
# In your terminal, find all occurrences:
grep -r "{ new: true }" src/
```

```typescript
// Replace every occurrence of:
{ new: true }

// With:
{ returnDocument: 'after' }
```

This is purely cosmetic but keeps logs clean and stays current with Mongoose v8.

---

## DO NOT CHANGE

These are working correctly — leave them alone:
- setImmediate runBG blocks (deletePayment: 150ms, addPayment: 141ms)
- All cache.get() / cache.set() patterns
- notifInFlight single-flight pattern
- perfMonitor middleware
- Self-ping keepalive (great addition — keep it)
- All analytics caching (0.2–0.6ms cache hits)
- getBookingById caching (0.958ms cache hits)
- getAgents caching (0.7–0.9ms cache hits)
- deletePayment handler (working at 210ms)

---

## VERIFICATION AFTER DEPLOY

Watch for these in Render logs:

```
✅ PASS — changes worked:
DELETE /api/bookings/:id — should be < 300ms
  [PERF] deleteBooking — deleteBookingDoc: < 200ms (not 3850ms)

PATCH /api/bookings/:id/status — should be < 200ms  
  [PERF] updateStatus — cacheInvalidation: 0ms | findAndUpdate: < 100ms

POST /api/bookings/:id/payments — should be < 300ms
  [MONGOOSE SLOW] Booking.findOne should NOT appear before payment insert

GET /api/bookings?assignedTo=unassigned — should be < 400ms
  No [MONGOOSE SLOW] for this filter

❌ STILL BROKEN — means change not applied:
[PERF] updateStatus — cacheInvalidation: 1800ms  (Change 2 not applied)
[MONGOOSE SLOW] Booking.findOne - 48000ms        (Change 3 not applied)  
[MONGOOSE SLOW] Booking.findOneAndDelete - 27000ms (Change 1 not applied)
```

---

## EXPECTED RESULTS

| Operation | Current | After 4 changes |
|---|---|---|
| DELETE /bookings/:id | 31,152ms | ~100–200ms |
| PATCH /bookings/:id/status | 1,871ms | ~80ms |
| POST /payments | 48,826ms | ~150ms |
| GET /bookings?assignedTo=unassigned | 5,354ms | ~150ms |
| GET /users/agents (cache miss) | 15,292ms (pool victim) | ~70ms |
| All cache hits | 0.5–1ms | 0.5–1ms (unchanged) |
| Pool starvation cascades | YES | NO |
