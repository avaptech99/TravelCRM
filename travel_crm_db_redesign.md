# Travel CRM — MongoDB Database Redesign Brief

**Goal:** All fetch and write operations under 200 ms on MongoDB Atlas Free Tier (M0 — 512 MB RAM, shared vCPU).  
**Database:** MongoDB 8.0.21  
**Collections:** `bookings`, `primarycontacts`, `passengers`, `travelers`, `payments`, `comments`, `activities`, `notifications`, `users`, `counters`, `crmsettings`, `missedcalls`

---

## Collection Inventory

| Collection | Doc Count | Size (BSON) | Status |
|---|---|---|---|
| bookings | 478 | ~226 KB | critical issues |
| primarycontacts | 478 | ~128 KB | issues |
| passengers | 102 | ~39 KB | ok |
| activities | 178 | ~30 KB | add TTL |
| notifications | 158 | ~29 KB | critical issues |
| comments | 221 | ~34 KB | minor |
| payments | 51 | ~9 KB | ok |
| users | 14 | ~3.5 KB | issues |
| travelers | 0 | 0 | drop it |
| missedcalls | 0 | 0 | empty |
| counters | — | ~42 B | ok |
| crmsettings | 0 | 0 | empty |

---

## Critical Issues & Fixes

### Issue 1 — Boolean fields stored as strings (HIGHEST PRIORITY)

**Problem:** Several boolean fields are stored as the strings `"True"` / `"False"` or `"Yes"` / `"No"` instead of native BSON booleans. This means existing indexes that cover these fields are effectively useless — MongoDB cannot efficiently filter `read: "False"` using an index built for boolean values. Every query against these fields does a partial or full collection scan.

**Affected fields:**

| Collection | Field | Current value | Should be |
|---|---|---|---|
| notifications | `read` | `"True"` / `"False"` | `true` / `false` |
| primarycontacts | `interested` | `"Yes"` / `"No"` | `true` / `false` |
| users | `isOnline` | `"True"` / `"False"` | `true` / `false` |
| bookings | `includesFlight` | `"True"` / `"False"` | `true` / `false` |
| bookings | `includesAdditionalServices` | `"True"` / `"False"` | `true` / `false` |
| bookings | `verified` | `"True"` / `"False"` | `true` / `false` |

**Fix — run these migration scripts in order:**

```js
// notifications.read
db.notifications.updateMany({ read: "True" },  { $set: { read: true } });
db.notifications.updateMany({ read: "False" }, { $set: { read: false } });

// primarycontacts.interested
db.primarycontacts.updateMany({ interested: "Yes" }, { $set: { interested: true } });
db.primarycontacts.updateMany({ interested: "No" },  { $set: { interested: false } });

// users.isOnline
db.users.updateMany({ isOnline: "True" },  { $set: { isOnline: true } });
db.users.updateMany({ isOnline: "False" }, { $set: { isOnline: false } });

// bookings booleans
db.bookings.updateMany({ includesFlight: "True" },  { $set: { includesFlight: true } });
db.bookings.updateMany({ includesFlight: "False" }, { $set: { includesFlight: false } });
db.bookings.updateMany({ includesAdditionalServices: "True" },  { $set: { includesAdditionalServices: true } });
db.bookings.updateMany({ includesAdditionalServices: "False" }, { $set: { includesAdditionalServices: false } });
db.bookings.updateMany({ verified: "True" },  { $set: { verified: true } });
db.bookings.updateMany({ verified: "False" }, { $set: { verified: false } });
```

**App-layer change:** Update all Mongoose/MongoDB schemas to declare these fields as `Boolean`, not `String`. Update all query code that filters on `"True"`/`"False"` strings to use `true`/`false`.

---

### Issue 2 — Numeric fields stored as strings

**Problem:** Financial and count fields are stored as strings. This prevents range queries, aggregation with `$sum`, and correct sorting.

**Affected fields in `bookings`:**

| Field | Example current value | Should be |
|---|---|---|
| `amount` | `"150000"` | `150000` (Number) |
| `totalAmount` | `"0"` | `0` (Number) |
| `outstanding` | `"40000"` | `40000` (Number) |
| `travellers` | `"2"` (or null) | `2` (Number or null) |
| `pricePerTicket` | `"0"` | `0` (Number) |

**Fix — verify before migrating:**

```js
// First, check for any non-numeric values that would break the cast
db.bookings.find({
  amount: { $not: /^[0-9.]*$/ }
}, { amount: 1, uniqueCode: 1 });

// If clean, run the migration
db.bookings.find({}).forEach(doc => {
  db.bookings.updateOne(
    { _id: doc._id },
    {
      $set: {
        amount:        doc.amount        ? parseFloat(doc.amount)        : 0,
        totalAmount:   doc.totalAmount   ? parseFloat(doc.totalAmount)   : 0,
        outstanding:   doc.outstanding   ? parseFloat(doc.outstanding)   : 0,
        pricePerTicket: doc.pricePerTicket ? parseFloat(doc.pricePerTicket) : 0,
        travellers:    doc.travellers    ? parseInt(doc.travellers)      : null,
      }
    }
  );
});
```

**App-layer change:** Update Mongoose schema types for these fields to `Number`. Remove any `parseInt`/`parseFloat` conversions happening at the application layer — the DB should be the source of truth.

---

### Issue 3 — bookings has 13 indexes (way too many for free tier)

**Problem:** Every write to `bookings` must update all 13 B-tree indexes. On Atlas M0 with 512 MB shared RAM, these indexes cannot all stay in memory simultaneously, causing disk I/O on writes and some reads. Several of the existing indexes are also redundant or low-selectivity (e.g. `destination`, `flightFrom`, `flightTo` are free-text string fields with no meaningful cardinality for index use).

**Current indexes on `bookings`:**

```
_id_
uniqueCode_1                    ← KEEP
createdAt_-1                    ← DROP (covered by compound below)
status_1                        ← DROP (covered by compound below)
assignedToUserId_1              ← DROP (covered by compound below)
contactPerson_1                 ← DROP (field being moved to embedded object)
contactNumber_1                 ← DROP (field being moved to embedded object)
createdByUserId_1               ← DROP (covered by compound below)
primaryContactId_1              ← DROP (covered by compound below)
destination_1                   ← DROP (low selectivity, not useful as index)
flightFrom_1                    ← DROP (low selectivity)
flightTo_1                      ← DROP (low selectivity)
travelDate_1                    ← DROP (covered by compound below)
```

**New indexes to create (create BEFORE dropping old ones):**

```js
// 1. Agent dashboard: "my open bookings, most recently touched"
// Covers: assignedToUserId filter + status filter + sort by lastInteractionAt
db.bookings.createIndex(
  { assignedToUserId: 1, status: 1, lastInteractionAt: -1 },
  { background: true, name: "agent_dashboard" }
);

// 2. Travel date reports and upcoming trip views
db.bookings.createIndex(
  { status: 1, travelDate: 1 },
  { background: true, name: "status_traveldate" }
);

// 3. Contact timeline — all bookings for a contact
db.bookings.createIndex(
  { primaryContactId: 1, createdAt: -1 },
  { background: true, name: "contact_timeline" }
);

// 4. Created-by queries
db.bookings.createIndex(
  { createdByUserId: 1, createdAt: -1 },
  { background: true, name: "creator_timeline" }
);

// Keep this one — it already exists and is correct:
// { uniqueCode: 1 } unique sparse
```

**Drop old indexes (only after creating new ones and verifying with explain()):**

```js
db.bookings.dropIndex("createdAt_-1");
db.bookings.dropIndex("status_1");
db.bookings.dropIndex("assignedToUserId_1");
db.bookings.dropIndex("contactPerson_1");
db.bookings.dropIndex("contactNumber_1");
db.bookings.dropIndex("createdByUserId_1");
db.bookings.dropIndex("primaryContactId_1");
db.bookings.dropIndex("destination_1");
db.bookings.dropIndex("flightFrom_1");
db.bookings.dropIndex("flightTo_1");
db.bookings.dropIndex("travelDate_1");
```

**Verify index is being used after change:**

```js
db.bookings.find(
  { assignedToUserId: "<some-id>", status: "Sent" }
).sort({ lastInteractionAt: -1 }).explain("executionStats");
// Look for: winningPlan.stage === "IXSCAN"
// Look for: totalDocsExamined ≈ nReturned (should be close, not 478)
```

---

### Issue 4 — No lastInteractionAt index

**Problem:** `lastInteractionAt` exists on booking documents (used for "sort by most recent activity" in dashboards) but has no index. Every sort on this field is a full collection scan — gets slower as bookings grow.

**Fix:** Covered by the new `agent_dashboard` compound index in Issue 3 above (`{ assignedToUserId: 1, status: 1, lastInteractionAt: -1 }`). No additional action needed once that index is created.

---

### Issue 5 — notifications and activities will grow unbounded

**Problem:** No TTL (Time-To-Live) index on `notifications` or `activities`. On Atlas M0, storage is capped. These collections will grow indefinitely — notifications especially accumulate fast with every booking action.

**Fix — add expireAt field and TTL indexes:**

```js
// Step 1: Backfill expireAt on existing notifications (expire 30 days after creation)
db.notifications.find({}).forEach(doc => {
  const expireAt = new Date(doc.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  db.notifications.updateOne({ _id: doc._id }, { $set: { expireAt } });
});

// Step 2: Create TTL index
db.notifications.createIndex(
  { expireAt: 1 },
  { expireAfterSeconds: 0, background: true, name: "ttl_expire" }
);

// Step 3: Backfill expireAt on activities (expire 90 days after creation)
db.activities.find({}).forEach(doc => {
  const expireAt = new Date(doc.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  db.activities.updateOne({ _id: doc._id }, { $set: { expireAt } });
});

// Step 4: Create TTL index on activities
db.activities.createIndex(
  { expireAt: 1 },
  { expireAfterSeconds: 0, background: true, name: "ttl_expire" }
);
```

**App-layer change:** When creating a new notification or activity document, always set `expireAt` at write time:

```js
// notifications
const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
await Notification.create({ userId, bookingId, message, read: false, expireAt });

// activities
const expireAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
await Activity.create({ bookingId, userId, action, details, expireAt });
```

---

### Issue 6 — contact data duplicated in three places

**Problem:**  
- `primarycontacts` collection stores `contactName` and `contactPhoneNo`  
- `bookings` also stores `contactPerson` (same name) and `contactNumber` (same phone) as top-level fields  
- `primaryContactId` is the FK linking them  

This means contact data is written twice on every booking create, and the `contactPerson` / `contactNumber` indexes on bookings are pure overhead.

**Fix — embed a contact snapshot in bookings:**

The goal is to avoid a `$lookup` join when listing bookings (the most common query). Embed a small read-optimised snapshot:

```js
// Migration: embed contact snapshot into each booking
db.bookings.find({}).forEach(doc => {
  if (!doc.primaryContactId) return;
  const contact = db.primarycontacts.findOne({ _id: doc.primaryContactId });
  if (!contact) return;
  db.bookings.updateOne(
    { _id: doc._id },
    {
      $set: {
        contact: {
          name:  contact.contactName,
          phone: contact.contactPhoneNo,
          type:  contact.bookingType,  // "Agent (B2B)" or "Direct (B2C)"
        }
      },
      $unset: {
        contactPerson: "",
        contactNumber: "",
      }
    }
  );
});
```

**App-layer change:**  
- On booking create: write `contact: { name, phone, type }` embedded in the booking document  
- Keep `primaryContactId` as the FK for full contact lookups  
- Remove writes to `contactPerson` and `contactNumber` top-level fields  
- Update booking list queries to use `booking.contact.name` instead of joining `primarycontacts`

---

### Issue 7 — travelers collection is empty, should be dropped

**Problem:** The `travelers` collection exists with a `bookingId` index but contains 0 documents. It appears to be a legacy collection replaced by `passengers`. It adds connection overhead and confusion.

**Fix:**

```js
// Verify it's empty first
db.travelers.countDocuments(); // should be 0

// Drop the collection
db.travelers.drop();
```

**App-layer change:** Remove all references to the `travelers` collection from models, controllers, and any import/export scripts.

---

### Issue 8 — comments index is suboptimal

**Problem:** `comments` has two separate indexes: `{ bookingId: 1 }` and `{ createdById: 1 }`. The real query pattern is always "get comments for a booking, sorted newest first." The separate `createdById` index is never the primary filter (nobody fetches all comments by a user across all bookings).

**Fix:**

```js
// Create compound index (do this first)
db.comments.createIndex(
  { bookingId: 1, createdAt: -1 },
  { background: true, name: "booking_comments_timeline" }
);

// Drop the two single-field indexes
db.comments.dropIndex("bookingId_1");
db.comments.dropIndex("createdById_1");
```

---

### Issue 9 — users.permissions stored as truncated string

**Problem:** `permissions` on users is stored as a Python-style dict string: `"{'leadVisibility': 'own', 'canAssignLeads': False, ..."` — it appears to be truncated and is not valid JSON. This field cannot be queried, filtered, or used in any meaningful way.

**Fix:**

```js
// Define the correct permissions structure and re-save properly
// First, audit what values actually exist:
db.users.find({}, { permissions: 1, name: 1 });

// Then update each user with a proper object:
db.users.updateOne(
  { email: "admin@travel.com" },
  {
    $set: {
      permissions: {
        leadVisibility:    "all",   // "own" or "all"
        canAssignLeads:    true,
        canEditActualCost: true,
        canVerifyBookings: true,
      }
    }
  }
);
// Repeat for each user with correct values
```

**App-layer change:** Update the User Mongoose schema to declare `permissions` as a nested object with typed sub-fields, not a `String`.

---

## Index Plan Summary

### bookings (13 → 5 indexes)

| Keep/Drop | Index | Reason |
|---|---|---|
| KEEP | `{ _id: 1 }` | automatic |
| KEEP | `{ uniqueCode: 1 }` unique sparse | booking code lookup |
| CREATE | `{ assignedToUserId: 1, status: 1, lastInteractionAt: -1 }` | agent dashboard |
| CREATE | `{ status: 1, travelDate: 1 }` | upcoming trips report |
| CREATE | `{ primaryContactId: 1, createdAt: -1 }` | contact timeline |
| CREATE | `{ createdByUserId: 1, createdAt: -1 }` | created-by queries |
| DROP | `{ createdAt: -1 }` | covered by compounds |
| DROP | `{ status: 1 }` | covered by compounds |
| DROP | `{ assignedToUserId: 1 }` | covered by compounds |
| DROP | `{ contactPerson: 1 }` | field removed |
| DROP | `{ contactNumber: 1 }` | field removed |
| DROP | `{ createdByUserId: 1 }` | covered by compound |
| DROP | `{ primaryContactId: 1 }` | covered by compound |
| DROP | `{ destination: 1 }` | low selectivity |
| DROP | `{ flightFrom: 1 }` | low selectivity |
| DROP | `{ flightTo: 1 }` | low selectivity |
| DROP | `{ travelDate: 1 }` | covered by compound |

### notifications

| Action | Index |
|---|---|
| KEEP | `{ userId: 1, read: 1 }` — works correctly once `read` is Boolean |
| KEEP | `{ userId: 1, createdAt: -1 }` |
| KEEP | `{ bookingId: 1 }` |
| CREATE | `{ expireAt: 1 }` TTL |

### activities

| Action | Index |
|---|---|
| KEEP | `{ bookingId: 1, createdAt: -1 }` |
| CREATE | `{ expireAt: 1 }` TTL |

### comments

| Action | Index |
|---|---|
| CREATE | `{ bookingId: 1, createdAt: -1 }` compound |
| DROP | `{ bookingId: 1 }` standalone |
| DROP | `{ createdById: 1 }` |

### primarycontacts

| Action | Index |
|---|---|
| KEEP | `{ contactPhoneNo: 1 }` |
| KEEP | `{ contactName: 1 }` |
| OPTIONAL | Add `{ contactName: "text" }` if you need full-text search on contact names |

---

## Optimised Query Patterns

After the changes above, use these query patterns in your application code:

### Agent dashboard (booking list)

```js
// Fetch bookings assigned to current user, open statuses, sorted by recent activity
db.bookings.find(
  {
    assignedToUserId: userId,
    status: { $in: ["Pending", "Working", "Sent"] }
  },
  {
    // Projection — only fetch what the list view needs
    uniqueCode: 1, destination: 1, status: 1,
    travelDate: 1, lastInteractionAt: 1,
    "contact.name": 1, "contact.phone": 1,
    amount: 1, outstanding: 1
  }
).sort({ lastInteractionAt: -1 }).limit(50);
// Uses index: agent_dashboard
// Expected: < 40 ms
```

### Single booking page — load all data in parallel

```js
// Before: sequential queries or $lookup aggregation
// After: parallel fetches, no joins needed

const bookingId = new ObjectId("...");

const [booking, passengers, payments, comments, activities] = await Promise.all([
  db.bookings.findOne({ _id: bookingId }),
  db.passengers.find({ bookingId }).toArray(),
  db.payments.find({ bookingId }).sort({ date: -1 }).toArray(),
  db.comments.find({ bookingId }).sort({ createdAt: -1 }).limit(30).toArray(),
  db.activities.find({ bookingId }).sort({ createdAt: -1 }).limit(20).toArray(),
]);
// All 5 queries run in parallel, all hit indexes on bookingId
// Expected: < 50 ms total (parallel, not sequential)
```

### Unread notifications

```js
// Only works correctly after fixing read field to Boolean (Issue 1)
db.notifications.find(
  { userId: userId, read: false },
  { message: 1, bookingId: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(20);
// Uses index: { userId: 1, read: 1 }
// Expected: < 20 ms
```

### Mark notifications as read

```js
db.notifications.updateMany(
  { userId: userId, read: false },
  { $set: { read: true, updatedAt: new Date() } }
);
```

### Contact search

```js
// By phone (exact match — most common in travel CRM)
db.primarycontacts.findOne({ contactPhoneNo: phoneNumber });

// By name (prefix search)
db.primarycontacts.find({
  contactName: { $regex: `^${searchTerm}`, $options: "i" }
}).limit(10);
```

---

## Mongoose Schema Changes

Update your Mongoose models to reflect the corrected types. Key changes:

```js
// bookings schema — key field type corrections
const bookingSchema = new Schema({
  primaryContactId:  { type: Schema.Types.ObjectId, ref: "PrimaryContact", required: true },
  contact: {                         // NEW — embedded snapshot
    name:  String,
    phone: String,
    type:  { type: String, enum: ["Agent (B2B)", "Direct (B2C)"] },
  },
  destination:    String,
  travelDate:     Date,              // was String
  returnDate:     Date,              // was String
  flightFrom:     String,
  flightTo:       String,
  tripType:       String,
  amount:         { type: Number, default: 0 },   // was String
  totalAmount:    { type: Number, default: 0 },   // was String
  outstanding:    { type: Number, default: 0 },   // was String
  pricePerTicket: { type: Number, default: 0 },   // was String
  travellers:     { type: Number, default: null }, // was String
  status:         { type: String, enum: ["Pending", "Working", "Sent", "Booked"] },
  includesFlight:             { type: Boolean, default: false },  // was String
  includesAdditionalServices: { type: Boolean, default: false },  // was String
  verified:       { type: Boolean, default: false },              // was String
  assignedToUserId:  { type: Schema.Types.ObjectId, ref: "User" },
  createdByUserId:   { type: Schema.Types.ObjectId, ref: "User" },
  lastInteractionAt: Date,
  uniqueCode:     String,
  segments:       { type: Array, default: [] },
  // remove: contactPerson, contactNumber (moved to contact embedded object)
}, { timestamps: true });

// notifications schema
const notificationSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
  message:   String,
  read:      { type: Boolean, default: false },   // was String
  expireAt:  { type: Date, required: true },       // NEW — for TTL
}, { timestamps: true });

// primarycontacts schema
const primaryContactSchema = new Schema({
  contactName:    String,
  contactPhoneNo: String,
  contactEmail:   String,
  bookingType:    { type: String, enum: ["Agent (B2B)", "Direct (B2C)"] },
  requirements:   String,
  interested:     { type: Boolean, default: false },  // was String "Yes"/"No"
  totalBookings:  { type: Number, default: 0 },       // NEW — denorm counter
  lastBookingAt:  Date,                               // NEW — denorm
}, { timestamps: true });

// users schema
const userSchema = new Schema({
  name:         String,
  email:        { type: String, unique: true },
  passwordHash: String,
  role:         { type: String, enum: ["ADMIN", "AGENT", "MANAGER"] },
  isOnline:     { type: Boolean, default: false },  // was String
  lastSeen:     Date,
  permissions: {                                    // was truncated String
    leadVisibility:    { type: String, enum: ["own", "all"], default: "own" },
    canAssignLeads:    { type: Boolean, default: false },
    canEditActualCost: { type: Boolean, default: false },
    canVerifyBookings: { type: Boolean, default: false },
  },
}, { timestamps: true });

// activities schema
const activitySchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  userId:    { type: Schema.Types.ObjectId, ref: "User" },
  action:    String,
  details:   String,
  expireAt:  { type: Date, required: true },  // NEW — for TTL
}, { timestamps: true });
```

---

## Migration Execution Order

Run in this exact order to avoid downtime and data loss:

1. **Fix booleans** — Issue 1 migration scripts. Zero risk, instant.
2. **Fix numeric fields** — Issue 2. Verify no bad data first.
3. **Add TTL expireAt field + index** — Issue 5. Background index, no downtime.
4. **Create new compound indexes on bookings** — Issue 3. Use `background: true`. Do NOT drop old indexes yet.
5. **Embed contact snapshot in bookings** — Issue 6 migration script.
6. **Update application code** to use new field names and types.
7. **Deploy app changes.**
8. **Run `explain()` on top queries** — verify `IXSCAN`, not `COLLSCAN`.
9. **Wait 7 days**, then check `db.bookings.aggregate([{$indexStats:{}}])` — drop any old index with `accesses.ops === 0`.
10. **Fix comments index** — Issue 8. Create compound, then drop old ones.
11. **Drop travelers collection** — Issue 7. Confirm `countDocuments() === 0` first.
12. **Fix users.permissions** — Issue 9. Manual per-user update with correct values.

---

## Verification Queries

After all changes, run these to confirm health:

```js
// 1. Confirm no string booleans remain
db.notifications.countDocuments({ read: { $type: "string" } });        // expect 0
db.primarycontacts.countDocuments({ interested: { $type: "string" } }); // expect 0
db.users.countDocuments({ isOnline: { $type: "string" } });             // expect 0

// 2. Confirm numeric fields
db.bookings.countDocuments({ amount: { $type: "string" } });     // expect 0
db.bookings.countDocuments({ outstanding: { $type: "string" } }); // expect 0

// 3. Check index count on bookings
db.bookings.getIndexes().length; // expect 6 (5 + _id)

// 4. Confirm TTL indexes exist
db.notifications.getIndexes(); // should show expireAt with expireAfterSeconds: 0
db.activities.getIndexes();    // same

// 5. Run explain on agent dashboard query
db.bookings.find(
  { assignedToUserId: ObjectId("<any-user-id>"), status: "Sent" }
).sort({ lastInteractionAt: -1 }).explain("executionStats");
// winningPlan.stage should be "IXSCAN"
// totalDocsExamined should be close to nReturned, not 478
```

---

## Expected Performance After Changes

| Operation | Before | After |
|---|---|---|
| Agent booking list (50 results) | ~300–600 ms | < 40 ms |
| Single booking page (parallel) | ~200–400 ms | < 50 ms |
| Unread notifications | ~150–300 ms | < 20 ms |
| Write a comment | ~80–150 ms | < 30 ms |
| Create booking | ~200–400 ms | < 60 ms |
| Contact phone lookup | < 20 ms | < 10 ms |
