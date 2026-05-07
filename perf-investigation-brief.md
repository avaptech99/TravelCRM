# 🐛 Performance Root Cause Investigation Brief
**App:** TravelCRM Backend (Node.js + MongoDB on Render Free Tier)  
**Log window:** 2026-05-07 07:11 – 07:38 UTC  
**Prepared for:** Coding Agent

---

## 📊 What the Logs Show (Summary)

| Endpoint | Normal Time | Spike Time |
|---|---|---|
| `GET /api/bookings?page=X` | ~130ms | **40,459ms** |
| `GET /api/bookings?status=Booked&page=1` | ~130ms | **31,910ms** |
| `GET /api/users/agents` | ~0.7ms (cache) | **31,097ms** |
| `PUT /api/bookings/:id` | — | **31,117ms** |
| `POST /api/bookings/:id/passengers` | — | **10,073ms** (DB: 8,042ms for only 2 passengers) |
| `DELETE /api/bookings/:id/payments/:id` | — | **4,026ms** |
| `DELETE /api/bookings/:id` | — | **4,454ms** |
| `GET /api/bookings/:id` | ~130–220ms | **7,097ms** (one specific booking) |
| `GET /api/notifications` | ~0.6ms (cache) | **23,723ms** |

> ✅ Cache hits are working (sub-1ms). The problem is **cache misses hitting MongoDB**.

---

## 🔍 Questions to Ask / Things to Investigate

### 1. Is skip-based pagination used for bookings queries?

```
Ask: Show me the Mongoose query inside getBookingsQuery. Does it use .skip(page * limit)?
```

**Why:** MongoDB's `.skip()` is O(n) — it scans all preceding documents. Page 20 at limit=15 means skipping 300 docs. This explains why page=22 (13.8s) and page=20 with `Sent` status (40.4s) are slow but page=1 is sometimes fast. **Fix: switch to cursor-based pagination using `_id` as cursor.**

---

### 2. What does `getBookingById` populate/join?

```
Ask: Show me the full Mongoose query for getBookingById. How many .populate() calls does it have? 
     Are any of them nested (populate inside populate)?
```

**Why:** `getBookingById` is consistently ~190ms but spiked to 7s for one booking. That specific booking likely has many passengers/payments/nested docs. Each `.populate()` is a separate DB round-trip — if there are N passengers and you populate each one, that's N+1 queries.

---

### 3. Why does adding 2 passengers take 8 seconds in DB?

```
Ask: Show me the addPassengers controller/service. Are the DB writes sequential (awaited in a loop)?
     Example pattern to look for:
       for (const p of passengers) {
         await Passenger.create(p);  // ← sequential, blocks each time
       }
     Should be: await Promise.all(passengers.map(p => Passenger.create(p)));
```

**Why:** The log says `DB: 8042ms | Count: 2` — 8 seconds for 2 inserts is only possible if they run sequentially and each hits a slow DB operation (e.g., triggering a post-save hook, re-fetching the full booking after each insert, or running a unique-index check on an unindexed field).

---

### 4. Are there missing indexes on the bookings collection?

```
Ask: Run db.bookings.getIndexes() and share the output.
     Also run: db.bookings.explain("executionStats").find({ status: "Sent" }).skip(285).limit(15)
     and check if it shows COLLSCAN (full collection scan) instead of IXSCAN.
```

**Why:** Queries filtered by `status` and sorted/paginated are hitting 16–40s on some pages. Without a compound index on `{ status: 1, _id: 1 }` (or whatever the sort field is), MongoDB scans the entire collection.

---

### 5. What is the MongoDB connection pool size? Is it exhausted during spikes?

```
Ask: What is the maxPoolSize set to in the Mongoose connection config?
     Is there any logging of active connections? Do the slow requests always happen in bursts 
     (multiple slow requests at exactly the same timestamp)?
```

**Why:** Looking at the logs around `07:36:16`, multiple endpoints all spike simultaneously: notifications (23.7s), bookings Booked page=1 (31.9s). This pattern strongly suggests **connection pool exhaustion** — requests queue up waiting for a free connection. Default Mongoose pool is 5; on a Free Tier instance with 1 worker this may not be enough if queries are long-running.

---

### 6. Does `PUT /api/bookings/:id` do a full document replace with re-validation?

```
Ask: Show me the PUT /api/bookings/:id handler. Does it:
     a) Fetch the full booking first, merge, then save?
     b) Run .validate() on the full document?
     c) Trigger any pre-save middleware (hooks)?
```

**Why:** `PUT /api/bookings/:id` took 31s. A full document replace on a large booking document, especially with pre-save hooks that do additional DB lookups, can compound into a very long operation.

---

### 7. Does the `/api/notifications` endpoint query without a user-scoped index?

```
Ask: Show me the Notification model schema and the query used in GET /api/notifications.
     Is there an index on { userId: 1, createdAt: -1 }?
```

**Why:** Notifications is hitting cache ~0.6ms when cached, but spikes to 23,723ms on cache miss. This suggests the underlying DB query does a full collection scan per user.

---

### 8. Is there a query timeout configured?

```
Ask: Is there a serverSelectionTimeoutMS or socketTimeoutMS or maxTimeMS set anywhere 
     in the Mongoose config or on individual queries?
```

**Why:** Without query timeouts, a single slow query can hold a DB connection for 40+ seconds, blocking all other requests that need that connection.

---

### 9. Is the Render Free Tier cold-start causing some of these spikes?

```
Ask: Is BASE_URL set and is there a keep-alive cron/ping configured?
     The logs show: ⚠️ BASE_URL not set. Server may go to sleep on Render Free Tier.
```

**Why:** The server slept and restarted between `07:13` and `07:31` (18 min idle). The first post-restart request to `/api/notifications` hit a 5,013ms timeout (`Error: Server selection timed out after 5000 ms` appears right before). All "first requests after wake" will be slow until MongoDB reconnects.

---

### 10. Are POST-save hooks or event emitters triggered on booking mutations?

```
Ask: Does the Booking model have any post('save') or post('findOneAndUpdate') hooks?
     Are any of these hooks async and awaited, or fire-and-forget?
```

**Why:** The `PATCH /api/bookings/:id/status` was fast (70ms) once but slow (2,017ms) another time. The `DELETE /api/bookings/:id` took 4.4s but the `[BG] Cleanup` log shows it only took 102ms — meaning the 4.3 remaining seconds were spent before the cleanup, likely in the main delete handler itself (possibly triggering hooks synchronously).

---

## 🛠️ Likely Root Causes (Priority Order)

| Priority | Root Cause | Evidence |
|---|---|---|
| 🔴 **#1** | Skip-based pagination on large collections | Page 20/22 = 13–40s; page 2/30 = 130ms |
| 🔴 **#2** | Sequential DB writes in addPassengers | 8042ms for 2 passengers |
| 🟠 **#3** | Connection pool exhaustion causing cascading slowness | Multiple endpoints spike simultaneously |
| 🟠 **#4** | Missing compound indexes on `{ status, _id }` | Filtered pagination consistently slower |
| 🟡 **#5** | N+1 queries in getBookingById for large bookings | One booking hit 7s vs 130ms baseline |
| 🟡 **#6** | No MongoDB query timeouts | Slow queries block pool indefinitely |
| 🟢 **#7** | Render Free Tier sleep / no BASE_URL keep-alive | Post-restart 500 on notifications |

---

## ✅ Quick Wins to Try First

1. **Replace `.skip()` with cursor-based pagination** using `_id > lastSeenId`
2. **Parallelize passenger inserts**: `await Promise.all(...)` instead of sequential loop
3. **Add compound index**: `db.bookings.createIndex({ status: 1, _id: 1 })`
4. **Set `BASE_URL`** and add a self-ping cron to prevent Render sleep
5. **Add `maxTimeMS(5000)`** to long-running queries so they fail fast instead of blocking
6. **Increase Mongoose `maxPoolSize`** to 10–20 in the connection config

---

## 📎 Relevant Log Lines for Reference

```
[PASSENGER PERF] Add Passengers - Total: 10072ms | DB: 8042ms | Count: 2
🐌 GET /api/bookings?status=Sent&page=20 — 40460ms
🐌 GET /api/bookings?status=Booked&page=1 — 31911ms
🐌 GET /api/users/agents — 31097ms
🐌 PUT /api/bookings/:id — 31117ms
getBookingById_69ca5e06: 7.095s  (same endpoint normally: ~135ms)
⚠️ BASE_URL not set. Server may go to sleep on Render Free Tier.
Error: Server selection timed out after 5000 ms
```
