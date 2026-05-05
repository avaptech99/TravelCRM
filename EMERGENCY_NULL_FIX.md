# 🚨 EMERGENCY FIX — Null Filter Crash + Cache Response Shape

## What broke
After applying the 5 performance fixes, the frontend crashes with:
`TypeError: Cannot read properties of null (reading 'filter')`

This means an API endpoint is returning `null`, `undefined`, or a wrapped object
`{ data: [] }` where the frontend expects a plain array `[]`.

There are 2 things to fix. Apply both immediately.

---

## FIX A — Guard all cache.get() calls against null/undefined

### Why
`node-cache` returns `undefined` (not `null`) for missing keys, BUT if a previous
request stored `null` or `undefined` as the value, subsequent cache hits will
return that bad value directly to the frontend.

### What to do

Open `src/controllers/analyticsController.ts`

Find every cache check that looks like this:
```typescript
// BROKEN — undefined check only, misses null
const cached = cache.get(cacheKey);
if (cached !== undefined) return res.status(200).json(cached);
```

Replace every instance with:
```typescript
// FIXED — guards against both null and undefined
const cached = cache.get(cacheKey);
if (cached !== undefined && cached !== null) return res.status(200).json(cached);
```

Do the same in `src/controllers/notificationController.ts`.

---

## FIX B — Ensure every analytics handler returns a plain array (not wrapped object)

### Why
The frontend React components call `.filter()` directly on the API response,
meaning they expect a raw array `[]`. If any handler changed its response shape
from `res.json(data)` to `res.json({ data })` or similar during the cache
refactor, it breaks the frontend.

### What to do

Open `src/controllers/analyticsController.ts`

For every handler, check the final `res.json(...)` call:

```typescript
// ❌ WRONG — wraps array in an object (breaks frontend .filter())
cache.set(cacheKey, { data }, 300);
return res.status(200).json({ data });

// ✅ CORRECT — returns plain array exactly as before
cache.set(cacheKey, data, 300);
return res.status(200).json(data);
```

Make sure `cache.set` and `res.json` are storing and returning the **exact same
value** that was returned before the cache was added — no wrapping, no mutation.

---

## FIX C — Add fallback empty arrays to the cache miss path

### Why
If the DB query itself returns `null` (e.g. aggregate returns empty), storing
`null` in the cache and returning it causes the frontend crash.

### What to do

In every analytics handler, add a null guard before caching:

```typescript
const rawData = await Booking.aggregate([...pipeline]);

// Guard: ensure we always store and return an array, never null
const data = rawData ?? [];

cache.set(cacheKey, data, 300);
return res.status(200).json(data);
```

Do the same for Payment aggregations and any other collection queries in
`analyticsController.ts`.

---

## FIX D — Fix the inFlight promise returning null on error

### Why
In `notificationController.ts`, if the DB query throws and the `finally` block
deletes the key, any concurrent requests that were awaiting `inFlight.get(cacheKey)`
will receive a rejected promise — which is unhandled and returns nothing to the
client, which React sees as `null`.

### What to do

Open `src/controllers/notificationController.ts`

Replace the inFlight block with this safer version:

```typescript
const cached = cache.get<any[]>(cacheKey);
if (cached !== undefined && cached !== null) {
  return res.status(200).json(cached);
}

if (inFlight.has(cacheKey)) {
  try {
    const data = await inFlight.get(cacheKey);
    return res.status(200).json(data ?? []);  // ← null guard here too
  } catch {
    // If the in-flight request failed, fall through to a fresh DB query
  }
}

const promise = Notification.find({ userId }).lean();
inFlight.set(cacheKey, promise);

try {
  const data = await promise;
  const safeData = data ?? [];
  cache.set(cacheKey, safeData, 60);
  return res.status(200).json(safeData);
} catch (err) {
  return res.status(500).json({ message: 'Failed to fetch notifications' });
} finally {
  inFlight.delete(cacheKey);
}
```

---

## FIX E — Clear the node-cache on startup (flush stale values)

### Why
If a bad value (null, undefined, wrong shape) was cached before this fix, it
will keep being served from cache for up to 5 minutes even after the code is fixed.

### What to do

Open `src/config/db.ts` (or wherever `mongoose.connect` is called and the
server startup logic runs).

After the MongoDB connection is confirmed, add one line to flush the cache:

```typescript
import cache from '../utils/cache'; // adjust path if needed

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log('MongoDB Connected.');
  cache.flushAll(); // ← ADD THIS — clears any bad cached values from previous deploy
  // ... rest of startup (syncIndexes, cron jobs, etc.)
});
```

This runs once on startup and is harmless — the cache simply rebuilds from fresh
DB queries on the first request after deploy.

---

## VERIFICATION CHECKLIST

After applying all fixes above:

```
[ ] Every cache.get() check uses: if (cached !== undefined && cached !== null)
[ ] Every res.json(data) returns the same shape as before caching was added
[ ] Every aggregate/find result has ?? [] fallback before cache.set()
[ ] notificationController inFlight catch block falls through to fresh query
[ ] cache.flushAll() is called once on successful DB connection at startup
```

---

## EXPECTED RESULT

- Frontend loads without "Something went wrong" error
- `.filter()` calls in React components work because APIs always return arrays
- Notifications never returns null even if DB query fails
- Analytics cache serves correct data immediately after deploy
