# APPLY THESE EXACT CHANGES — bookingController.ts
## 3 bugs + .lean() audit. Nothing else. Do not refactor anything else.

---

## BEFORE YOU START

Show me the current code for each function listed below.
Read the file first. Then apply each change exactly as described.
After each change, confirm what line you changed and show the before/after.

---

## BUG 1 — deleteBooking: replace findOneAndDelete / findByIdAndDelete with deleteOne

### Find this function: deleteBooking
### Search for any of these lines inside it:

```
Booking.findOneAndDelete(
Booking.findByIdAndDelete(
```

### Replace with:
```typescript
const deleteResult = await Booking.deleteOne({ _id: bookingId });
if (deleteResult.deletedCount === 0) {
  return res.status(404).json({ message: 'Booking not found' });
}
```

### Rules:
- Do NOT change anything else in this function
- Do NOT change the setImmediate block
- Do NOT change res.status(200).json()
- Only change the delete operation itself

### Why: findOneAndDelete holds a write lock for 27+ seconds on M0.
### deleteOne releases immediately. One word change = 27s improvement.

---

## BUG 2 — addPayment: remove Booking.findById / findOne validation

### Find this function: addPayment (POST /bookings/:id/payments)
### Search for any of these lines BEFORE Payment.create():

```
Booking.findById(
Booking.findOne(
Booking.exists(
```

### Delete those lines entirely — the if (!booking) check too.
### The function must go straight to Payment.create() with no booking lookup.

```typescript
// CORRECT start of addPayment after param extraction:
const payment = await Payment.create({
  ...req.body,
  bookingId,
  createdAt: new Date(),
});
res.status(201).json(payment);
// setImmediate runBG block follows...
```

### Rules:
- Delete the booking validation lookup — all of it
- Do NOT change Payment.create()
- Do NOT change the setImmediate runBG block
- Do NOT change res.status(201).json()

### Why: That Booking.findOne waits for a pool connection.
### When pool is locked it waits 48,826ms. Validation is unnecessary
### on an authenticated route — Payment.create() will fail naturally
### if bookingId is invalid.

---

## BUG 3 — updateBookingStatus: remove DB call from cache invalidation

### Find this function: updateBookingStatus (PATCH /bookings/:id/status)
### After the findByIdAndUpdate call, search for any of these:

```
await Booking.findById(
await Booking.findOne(
await Booking.findByIdAndUpdate(   ← a SECOND one (after the first)
```

### If found — delete it. Use the `updated` variable from the first
### findByIdAndUpdate call instead.

### The cache invalidation must use zero awaits — only cache.del():

```typescript
const updated = await Booking.findByIdAndUpdate(
  id,
  { status, lastInteractionAt: new Date() },
  { returnDocument: 'after' }  // replaces { new: true }
).lean();

if (!updated) return res.status(404).json({ message: 'Booking not found' });

// Cache bust — ALL synchronous, zero ms, zero DB calls:
cache.del(`booking_${id}`);
if ((updated as any).assignedToUserId) {
  cache.del(`sync_${(updated as any).assignedToUserId}`);
}
cache.keys()
  .filter((k: string) => k.startsWith('bookings_'))
  .forEach((k: string) => cache.del(k));

res.status(200).json(updated);
// setImmediate runBG for Timeline/Notification follows
```

### Rules:
- Zero awaits between findByIdAndUpdate and res.json()
- cache.del() calls are synchronous — they take 0ms and need no await
- Replace { new: true } with { returnDocument: 'after' } — fixes deprecation warning
- Use updated.assignedToUserId directly — do not fetch it again

### Why: PERF timer proved cacheInvalidation: 1,871ms | findAndUpdate: 0ms
### The update is instant. The cache bust is slow because it's doing
### a DB query. Remove that query and it drops to 0ms.

---

## .lean() AUDIT — every read query in the entire codebase

### Open every controller file:
- bookingController.ts
- userController.ts
- notificationController.ts
- analyticsController.ts
- settingsController.ts
- paymentController.ts
- passengerController.ts
- any other controller files

### Find every query that does NOT already have .lean():
```
Model.find(
Model.findById(
Model.findOne(
Model.aggregate(   ← aggregate already returns plain objects, skip
```

### Add .lean() to every one EXCEPT:
- Queries where the result is passed to .save() — skip those
- Queries inside Mongoose middleware/hooks — skip those
- Payment.create(), Booking.create() etc — skip (not reads)

### Example:
```typescript
// BEFORE:
const bookings = await Booking.find(query).sort(...).limit(15);

// AFTER:
const bookings = await Booking.find(query).sort(...).limit(15).lean();
```

### Chain position: .lean() goes after .sort()/.limit()/.select()
### but before .exec() if you use it.

### Rules:
- Do NOT add .lean() to write operations
- Do NOT add .lean() where the result calls .save() or .populate() that needs hydration
- If a query already has .lean() — skip it, don't add it twice

---

## VERIFICATION — after applying all changes

Show me:
1. The deleteBooking function — confirm deleteOne is used, not findOneAndDelete
2. The addPayment function — confirm no Booking.findById before Payment.create
3. The updateBookingStatus function — confirm zero awaits between
   findByIdAndUpdate and res.json()
4. Count of .lean() calls added across all controllers

---

## DO NOT CHANGE

- setImmediate runBG blocks — leave exactly as they are
- cache.get() / cache.set() patterns — leave as they are
- The runBG semaphore at the top of bookingController.ts — leave as is
- notifInFlight single-flight pattern — leave as is
- perfMonitor middleware — leave as is
- Self-ping keepalive — leave as is
- Index definitions in Booking.ts — leave as is
- Any handler not mentioned above — do not touch
