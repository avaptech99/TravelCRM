# 🔬 Full Instrumentation Guide — Granular Timers for All Controllers & Polling
**App:** TravelCRM Backend (Node.js + Mongoose)  
**Goal:** Pinpoint exactly where time is spent in every request — before making any code changes.

---

## Why Instrument Everything (Not Just Slow Endpoints)

Profiling only the endpoints you *think* are slow creates blind spots. A controller that looks fast at 130ms might be hiding a 120ms unnecessary DB call. Instrumentation across the board also lets you:

- Build a **baseline** for every endpoint before any fix
- Catch regressions after changes
- Spot N+1 patterns that don't show up as "slow" individually but compound under load
- Understand polling overhead precisely

---

## Step 1 — Add a Shared Performance Logger Utility

Create this file once and import it everywhere:

```typescript
// src/utils/perfLogger.ts

export function createTimer(label: string) {
  const segments: { name: string; duration: number }[] = [];
  let lastMark = Date.now();
  const start = lastMark;

  return {
    mark(segmentName: string) {
      const now = Date.now();
      segments.push({ name: segmentName, duration: now - lastMark });
      lastMark = now;
    },
    end(extra?: Record<string, unknown>) {
      const total = Date.now() - start;
      const breakdown = segments.map(s => `${s.name}: ${s.duration}ms`).join(' | ');
      console.log(`[PERF] ${label} — Total: ${total}ms | ${breakdown}`, extra ?? '');
      return total;
    }
  };
}
```

---

## Step 2 — Instrument Every Controller

Apply the pattern below to **every single controller function**. Copy the template, swap the label and segment names to match what that controller actually does.

### Template Pattern

```typescript
import { createTimer } from '../utils/perfLogger';

export const myController = async (req, res) => {
  const t = createTimer('myController');
  try {
    t.mark('buildQuery');
    const query = buildQuery(req.query);

    t.mark('countDocuments');
    const total = await Model.countDocuments(query).maxTimeMS(3000);

    t.mark('findDocuments');
    const results = await Model.find(query).skip(x).limit(y);

    t.mark('populate');
    await Model.populate(results, { path: 'someField' });

    t.mark('formatResponse');
    const response = formatResults(results);

    t.end({ resultCount: results.length });
    res.json(response);
  } catch (err) {
    t.end({ error: err.message });
    next(err);
  }
};
```

---

## Step 3 — Controller-by-Controller Instrumentation

### 📁 bookingController.ts

#### `getBookings`
```typescript
const t = createTimer('getBookings');

t.mark('parseFilters');
// your filter parsing code

t.mark('countDocuments');
const total = await Booking.countDocuments(filter).maxTimeMS(5000);

t.mark('findWithSkip');
const bookings = await Booking.find(filter).skip(skip).limit(limit).sort(sort);

t.mark('populate');
// any populate calls

t.mark('cacheWrite');
// if you write to cache after fetching

t.end({ page, limit, total, returned: bookings.length });
```

> 🎯 **Key question this answers:** Is the bottleneck `countDocuments`, `find+skip`, or `populate`?

---

#### `getBookingById`
```typescript
const t = createTimer(`getBookingById_${id}`);

t.mark('checkCache');
// cache lookup

t.mark('findById');
const booking = await Booking.findById(id).maxTimeMS(3000);

t.mark('populatePassengers');
await booking.populate('passengers');

t.mark('populatePayments');
await booking.populate('payments');

t.mark('populateTimeline');
await booking.populate('timeline');

t.mark('populateAssignee');
await booking.populate('assignedToUserId');

// Add a mark for EVERY populate call you have

t.end({ bookingId: id, passengerCount: booking.passengers?.length });
```

> 🎯 **Key question this answers:** Which specific populate is slow? Is one booking's data unusually large?

---

#### `createBooking`
```typescript
const t = createTimer('createBooking');

t.mark('validate');
// validation logic

t.mark('insertBooking');
const booking = await Booking.create(data);

t.mark('createTimeline');
await Timeline.create({ bookingId: booking._id, ... });

t.mark('createNotification');
await Notification.create({ ... });

t.mark('postHooks');
// any post-save side effects

t.end({ bookingId: booking._id });
```

> 🎯 **Key question this answers:** Are post-create side effects (timeline, notification) adding hidden latency?

---

#### `updateBooking` (PUT)
```typescript
const t = createTimer(`updateBooking_${id}`);

t.mark('fetchExisting');
const existing = await Booking.findById(id);

t.mark('mergeData');
Object.assign(existing, updates);

t.mark('validate');
await existing.validate();

t.mark('save');
await existing.save();           // ← pre/post save hooks fire here

t.mark('timelineEntry');
await Timeline.create({ ... });

t.end({ bookingId: id });
```

> 🎯 **Key question this answers:** Is `.save()` itself slow (suggesting hook overhead) or is it the fetch/merge?

---

#### `updateBookingStatus` (PATCH /status)
```typescript
const t = createTimer(`updateStatus_${id}`);

t.mark('findAndUpdate');
const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });

t.mark('sideEffects');
// notifications, timeline, emails triggered by status change

t.end({ bookingId: id, newStatus: status });
```

> 🎯 **Key question this answers:** This was 70ms once and 2017ms another time — is `sideEffects` the variable?

---

#### `addPassengers`
```typescript
const t = createTimer(`addPassengers_${bookingId}`);

t.mark('validatePassengers');
// validation

t.mark('insertPassengers');
// ARE THESE SEQUENTIAL OR PARALLEL? This is the key question.
// Sequential (BAD):
for (const p of passengers) {
  await Passenger.create(p);   // each one blocks here
}
// Parallel (GOOD):
await Promise.all(passengers.map(p => Passenger.create(p)));

t.mark('updateBookingRef');
await Booking.findByIdAndUpdate(bookingId, { $push: { passengers: { $each: ids } } });

t.mark('refetchBooking');
// if you re-fetch the whole booking after insert

t.end({ bookingId, count: passengers.length });
```

> 🎯 **Key question this answers:** The log showed DB: 8042ms for 2 passengers. The timer will show exactly which sub-step.

---

#### `deleteBooking`
```typescript
const t = createTimer(`deleteBooking_${id}`);

t.mark('findBooking');
const booking = await Booking.findById(id);

t.mark('deletePassengers');
await Passenger.deleteMany({ bookingId: id });

t.mark('deletePayments');
await Payment.deleteMany({ bookingId: id });

t.mark('deleteTimeline');
await Timeline.deleteMany({ bookingId: id });

t.mark('deleteBookingDoc');
await Booking.findByIdAndDelete(id);

t.mark('bgCleanup');
// background cleanup tasks

t.end({ bookingId: id });
```

---

#### `addPayment` / `deletePayment`
```typescript
const t = createTimer(`addPayment_${bookingId}`);

t.mark('insertPayment');
const payment = await Payment.create(data);

t.mark('updateBookingTotal');
// recalculate and update booking totals

t.mark('refetchBooking');
// if you re-fetch after payment

t.end({ bookingId, paymentId: payment._id });
```

---

#### `bulkAssign`
```typescript
const t = createTimer('bulkAssign');

t.mark('fetchBookings');
const bookings = await Booking.find({ _id: { $in: ids } });

t.mark('updateEach');
// Is this a loop of individual .save() calls or a single updateMany?
// BAD: for (const b of bookings) { await b.save(); }
// GOOD: await Booking.updateMany({ _id: { $in: ids } }, { assignedToUserId: userId });

t.mark('insertTimelines');
// Are these individual creates or insertMany?

t.mark('insertNotifications');
// Individual creates or insertMany?

t.end({ count: ids.length });
```

---

### 📁 notificationController.ts

#### `getNotifications`
```typescript
const t = createTimer(`getNotifications_${userId}`);

t.mark('checkCache');
const cached = await cache.get(`notifications_${userId}`);
if (cached) { t.end({ source: 'cache' }); return res.json(cached); }

t.mark('dbQuery');
const notifications = await Notification.find({ userId })
  .sort({ createdAt: -1 })
  .limit(50)
  .maxTimeMS(2000);

t.mark('cacheWrite');
await cache.set(`notifications_${userId}`, notifications, TTL);

t.end({ source: 'db', count: notifications.length });
```

> 🎯 **Key question this answers:** This endpoint spiked to 23,723ms on cache miss. The timer will reveal if the DB query itself is slow or if something else fires after it.

---

### 📁 authController.ts

#### `login`
```typescript
const t = createTimer('login');

t.mark('findUser');
const user = await User.findOne({ email }).maxTimeMS(2000);

t.mark('bcryptCompare');
const valid = await bcrypt.compare(password, user.passwordHash);
// bcrypt is intentionally slow — log this to know its baseline

t.mark('generateToken');
const token = jwt.sign({ userId: user._id }, secret);

t.mark('updateLastLogin');
await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

t.end({ userId: user._id });
```

> The log showed: `[LOGIN PERF] Total: 488ms | DB: 387ms | Bcrypt: 100ms` — your existing log already does this, but verify that 387ms DB time is not hiding a slow `findOne`.

---

### 📁 userController.ts

#### `getAgents`
```typescript
const t = createTimer('getAgents');

t.mark('checkCache');
const cached = await cache.get('users_agents');
if (cached) { t.end({ source: 'cache' }); return res.json(cached); }

t.mark('dbQuery');
const agents = await User.find({ role: 'agent' }).maxTimeMS(3000);

t.mark('cacheWrite');
await cache.set('users_agents', agents, TTL);

t.end({ source: 'db', count: agents.length });
```

> 🎯 **Key question this answers:** `getAgents` spiked to 31,097ms. Cache was working (0.7ms on hits). Timer will confirm if the DB query is unindexed on `role`.

---

### 📁 settingsController.ts

#### `getDropdowns`
```typescript
const t = createTimer('getDropdowns');

t.mark('checkCache');
// cache check

t.mark('dbQueries');
// Are multiple collections fetched here in parallel or sequentially?
const [types, statuses, destinations] = await Promise.all([
  TripType.find(),
  BookingStatus.find(),
  Destination.find(),
]);

t.end({ source: 'db' });
```

---

## Step 4 — Instrument All Polling Endpoints

Polling endpoints are called on an interval (every 20–60s typically). They look cheap individually but under load accumulate quickly.

### Identify Your Polling Endpoints

These are the endpoints your frontend calls on a timer. From the logs, confirmed polling endpoints are:

| Endpoint | Observed Interval | Cache Hit Rate |
|---|---|---|
| `GET /api/notifications` | ~20s | High (but spikes on miss) |
| `GET /api/sync` | ~20s | Unknown |
| `GET /api/settings/dropdowns` | On load + refresh | High |
| `GET /api/bookings?page=1` | On tab focus | Medium |

### Add Poll-Aware Logging

```typescript
// src/middleware/pollLogger.ts

const POLLING_ENDPOINTS = [
  '/api/notifications',
  '/api/sync',
  '/api/settings/dropdowns',
];

export function pollLogger(req, res, next) {
  if (POLLING_ENDPOINTS.some(p => req.path.startsWith(p))) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const source = res.getHeader('X-Cache-Status') ?? 'unknown';
      console.log(
        `[POLL] ${req.method} ${req.path} — ${duration}ms | Status: ${res.statusCode} | Cache: ${source} | Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      );
    });
  }
  next();
}
```

Register in `app.ts` / `server.ts`:
```typescript
import { pollLogger } from './middleware/pollLogger';
app.use(pollLogger);
```

### Add Cache Status Header in Your Cache Middleware

```typescript
// In your cache middleware or controller:
if (cached) {
  res.setHeader('X-Cache-Status', 'HIT');
  return res.json(cached);
}
// On DB fetch:
res.setHeader('X-Cache-Status', 'MISS');
```

This lets the `pollLogger` report whether each poll hit the cache or went to DB, so you can see the **miss rate per endpoint over time**.

### Measure Polling Frequency Impact

Add this to understand actual polling pressure:

```typescript
// src/middleware/requestCounter.ts

const counters: Record<string, number> = {};

setInterval(() => {
  if (Object.keys(counters).length > 0) {
    console.log('[POLL RATE] Last 60s:', JSON.stringify(counters));
    Object.keys(counters).forEach(k => (counters[k] = 0));
  }
}, 60_000);

export function requestCounter(req, res, next) {
  counters[req.path] = (counters[req.path] ?? 0) + 1;
  next();
}
```

This will output something like:
```
[POLL RATE] Last 60s: { "/api/notifications": 18, "/api/sync": 12, "/api/bookings": 4 }
```
Divide by 60 to get requests/second. If `/api/notifications` is 18/min from one user, it's 360/min with 20 users — even tiny inefficiencies compound.

---

## Step 5 — Add Mongoose-Level Query Logging

This catches slow queries that happen *inside* populate chains — not visible from controller timers alone.

```typescript
// In db.ts, after mongoose.connect():

mongoose.set('debug', (collectionName, method, query, doc) => {
  // Only log queries taking more than 50ms
});

// Better: use Mongoose middleware on the model level
// In Booking.ts (schema definition):
BookingSchema.pre(/^find/, function (next) {
  (this as any)._queryStart = Date.now();
  next();
});

BookingSchema.post(/^find/, function (docs, next) {
  const duration = Date.now() - (this as any)._queryStart;
  if (duration > 100) {
    console.log(`[MONGOOSE SLOW] Booking.${(this as any).op} — ${duration}ms | filter: ${JSON.stringify((this as any)._conditions)}`);
  }
  next();
});
```

Add the same pre/post hooks to `Notification`, `Passenger`, `Payment`, `Timeline`, `User` models.

---

## Step 6 — What to Do With the Output

Once instrumentation is deployed, trigger each slow endpoint **once** and collect the console output. Share the timer lines here. The format will look like:

```
[PERF] getBookings — Total: 31910ms | parseFilters: 1ms | countDocuments: 31ms | findWithSkip: 31840ms | populate: 12ms | cacheWrite: 26ms
```

From that single line you know: `findWithSkip` is the problem. Not the count, not the populate.

Or:

```
[PERF] getBookingById_69ca5e06 — Total: 7095ms | checkCache: 0ms | findById: 45ms | populatePassengers: 6ms | populatePayments: 7040ms | populateTimeline: 4ms
```

From that: `populatePayments` is the problem — that booking has an unusually large payments array.

---

## Checklist for Your Coding Agent

- [ ] Create `src/utils/perfLogger.ts` with the `createTimer` utility
- [ ] Add `createTimer` instrumentation to `getBookings` (with individual marks for count, find, populate)
- [ ] Add `createTimer` instrumentation to `getBookingById` (with a mark per populate call)
- [ ] Add `createTimer` instrumentation to `createBooking`
- [ ] Add `createTimer` instrumentation to `updateBooking` (PUT)
- [ ] Add `createTimer` instrumentation to `updateBookingStatus` (PATCH)
- [ ] Add `createTimer` instrumentation to `addPassengers` (mark each step of the insert)
- [ ] Add `createTimer` instrumentation to `deleteBooking`
- [ ] Add `createTimer` instrumentation to `addPayment` / `deletePayment`
- [ ] Add `createTimer` instrumentation to `bulkAssign`
- [ ] Add `createTimer` instrumentation to `getNotifications`
- [ ] Add `createTimer` instrumentation to `login`
- [ ] Add `createTimer` instrumentation to `getAgents`
- [ ] Add `createTimer` instrumentation to `getDropdowns`
- [ ] Create `src/middleware/pollLogger.ts` and register it in `app.ts`
- [ ] Add `X-Cache-Status` header in cache hit/miss paths
- [ ] Create `src/middleware/requestCounter.ts` and register it in `app.ts`
- [ ] Add Mongoose pre/post `find` hooks on Booking, Notification, User, Passenger, Payment, Timeline models
- [ ] Deploy and trigger one request per slow endpoint
- [ ] Share the `[PERF]` log lines — do NOT make any query changes until the timer output is reviewed

---

## ⚠️ Important Notes

- **Do NOT fix anything yet.** The entire point of this step is to measure. Fixing before measuring risks changing the wrong thing.
- These timers add ~0.01ms overhead each — negligible in production.
- Remove or gate behind `process.env.PERF_LOGGING=true` before going to high-traffic production.
- The `maxTimeMS()` calls added in the timer examples are safe to keep permanently — they prevent runaway queries.
