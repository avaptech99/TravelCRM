# CRM 2.0 — Database Restructure Implementation Guide

> **For the coding agent:** This document defines the complete new MongoDB schema for the CRM 2.0 project, the migration steps from the old structure, and all indexes to create. Follow sections in order. Do not modify collection names — they must match exactly as written.

---

## Overview of Changes

| Old Collection | Action | Reason |
|---|---|---|
| `primarycontacts` | **Rename → `contacts`** + add fields | Owns Stage 1 & 2 lifecycle fields |
| `bookings` | **Remove flight/status fields** | Flight data moves to `segments` |
| `passengers` | **Remove flight fields** | Duplication — already in `segments` |
| `missedcalls` | **Delete** | Empty, unused — define when feature is built |
| `notifications` | **Delete** | Empty, unused — define when feature is built |
| `segments` | **Create new** | Stores per-leg flight data |
| `costs` | **Create new** | Replaces embedded `estimatedCosts` + `actualCosts` arrays |
| `suppliers` | **Create new** | Normalizes the cost `source` dropdown |
| `payments` | **Define schema** | Was empty — schema now fully defined |

---

## Collection Schemas

### 1. `contacts`
> Stage 1 (New Booking) and Stage 2 (Edit icon) both write to this collection.

```js
{
  _id: ObjectId,
  contactName: String,           // Stage 1 — full legal name
  contactPhoneNo: String,        // Stage 1 — with country code e.g. "+919888844882"
  contactEmail: String | null,   // Stage 1 — optional
  bookingType: String,           // Stage 1 — enum: "Direct (B2C)" | "Agent (B2B)"
  requirements: String,          // Stage 1 — compulsory multi-line text
  assignedGroup: String | null,  // Stage 1 & 2 — enum: "LCC" | "Package" | "Visa" | ...
  status: String,                // Stage 1 default: "Pending" | "Working" | "Sent" | "Booked" | "Follow up"
  interested: String,            // Stage 2 — enum: "Yes" | "No" | null
  assignedToUserId: ObjectId | null, // Stage 2 — ref: users._id
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```js
db.contacts.createIndex({ contactPhoneNo: 1 })
db.contacts.createIndex({ status: 1, assignedGroup: 1, assignedToUserId: 1 })
db.contacts.createIndex({ createdAt: -1 })
```

---

### 2. `bookings`
> Created only at Stage 3 (Finalize Booking). Links back to `contacts` via `contactId`.

```js
{
  _id: ObjectId,
  uniqueCode: String,            // e.g. "TW0003" — auto-generated from counters collection
  contactId: ObjectId,           // ref: contacts._id (replaces primaryContactId)
  finalQuotation: String | null, // e.g. "TW0002-B" — dropdown A to G
  companyName: String | null,    // dropdown managed in crmsettings (key: "companies")
  includesFlight: Boolean,       // Stage 3 toggle
  includesAdditionalServices: Boolean, // Stage 3 toggle
  additionalServicesDetails: String | null, // single text blob with prefixes e.g. "Visa- ...\nHotel- ..."
  tripType: String | null,       // enum: "one-way" | "round-trip" | "multi-city"
  lumpSumAmount: Number,         // Stage 3F — final price quoted to customer
  estimatedMargin: Number,       // auto-calculated: lumpSumAmount - sum(estimated costs)
  netMargin: Number,             // auto-calculated: lumpSumAmount - sum(actual costs)
  outstanding: Number,           // lumpSumAmount - sum(payments received)
  verified: Boolean,             // default: false
  verifiedBy: ObjectId | null,   // ref: users._id
  assignedToUserId: ObjectId | null, // ref: users._id
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```js
db.bookings.createIndex({ contactId: 1 })
db.bookings.createIndex({ uniqueCode: 1 }, { unique: true })
db.bookings.createIndex({ assignedToUserId: 1, createdAt: -1 })
```

---

### 3. `segments`
> One document per flight leg. Replaces all flat flight fields that were duplicated across `bookings` and `passengers`.

```js
{
  _id: ObjectId,
  bookingId: ObjectId,           // ref: bookings._id
  legNumber: Number,             // 1 = outbound, 2 = return, 3+ = multi-city legs
  flightFrom: String,            // origin city/airport name
  flightTo: String,              // destination city/airport name
  departureTime: String | null,  // ISO datetime string or formatted date-time
  arrivalTime: String | null,
  returnDepartureTime: String | null,  // populated for legNumber >= 2
  returnArrivalTime: String | null
}
```

**Index:**
```js
db.segments.createIndex({ bookingId: 1, legNumber: 1 })
```

**Important:** For a one-way trip, insert 1 segment (legNumber: 1). For round-trip, insert 1 segment with all 4 time fields populated. For multi-city, insert N segments (legNumber: 1, 2, 3...).

---

### 4. `passengers`
> One document per traveler per booking. No flight fields — those are in `segments`.

```js
{
  _id: ObjectId,
  bookingId: ObjectId,           // ref: bookings._id
  name: String,                  // full legal name for ticketing
  countryCode: String,           // e.g. "+91"
  phoneNumber: String,
  email: String,
  dob: String,                   // "YYYY-MM-DD" — required for flight/visa
  anniversary: String,           // optional — for marketing
  country: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Index:**
```js
db.passengers.createIndex({ bookingId: 1 })
```

---

### 5. `costs`
> Replaces the two embedded arrays `estimatedCosts` and `actualCosts` that were inside the bookings document.

```js
{
  _id: ObjectId,
  bookingId: ObjectId,           // ref: bookings._id
  costType: String,              // enum: "Air Ticket" | "Hotel" | "Visa" | "Insurance" | "Ground Handling" | "Sightseeing"
  price: Number,
  supplierId: ObjectId | null,   // ref: suppliers._id
  costKind: String,              // enum: "estimated" | "actual"
  createdAt: Date
}
```

**Index:**
```js
db.costs.createIndex({ bookingId: 1 })
```

**Note:** To calculate `estimatedMargin`, query `{ bookingId, costKind: "estimated" }` and sum `price`. For `netMargin`, query `{ bookingId, costKind: "actual" }`.

---

### 6. `payments`
> One document per payment transaction received against a booking.

```js
{
  _id: ObjectId,
  bookingId: ObjectId,           // ref: bookings._id
  amount: Number,
  method: String,                // enum: "Bank Transfer" | "Cash" | "UPI" | "Credit Card"
  transactionId: String,         // reference number for verification
  paymentDate: Date,
  remarks: String,
  createdAt: Date
}
```

**Index:**
```js
db.payments.createIndex({ bookingId: 1 })
```

---

### 7. `comments`
> Activity log / remarks. Can be linked to a contact (Stage 2, before booking exists) or a booking (Stage 3+).

```js
{
  _id: ObjectId,
  bookingId: ObjectId | null,    // ref: bookings._id — null if remark added before booking is created
  contactId: ObjectId | null,    // ref: contacts._id — always populated
  createdById: ObjectId,         // ref: users._id
  text: String,
  createdAt: Date
}
```

**Index:**
```js
db.comments.createIndex({ bookingId: 1, createdAt: -1 })
db.comments.createIndex({ contactId: 1, createdAt: -1 })
```

---

### 8. `suppliers`
> Admin-managed list of suppliers/providers. Normalizes the `source` dropdown in cost rows.

```js
{
  _id: ObjectId,
  name: String,                  // e.g. "IndiGo", "MakeMyTrip"
  category: String,              // enum: "Air Ticket" | "Hotel" | "Visa" | "Insurance" | "Ground Handling" | "Sightseeing"
  contactInfo: String,
  createdAt: Date
}
```

**Index:**
```js
db.suppliers.createIndex({ name: 1 })
db.suppliers.createIndex({ category: 1 })
```

---

### 9. `users`
> No structural change needed. Keep as-is.

```js
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: String,                  // enum: "ADMIN" | "AGENT"
  isOnline: Boolean,
  permissions: Object,
  lastSeen: Date,
  createdAt: Date
}
```

---

### 10. `crmsettings`
> Admin-managed dropdown lists. Keep as-is. Key values currently in use: `"companies"`.

```js
{
  _id: ObjectId,
  key: String,                   // e.g. "companies", "assignedGroups"
  values: Array,                 // array of strings
  createdAt: Date,
  updatedAt: Date
}
```

---

### 11. `counters`
> Auto-increment sequences. Keep as-is.

```js
{
  _id: String,                   // e.g. "bookingId"
  seq: Number                    // current sequence value
}
```

Usage — when creating a new booking, atomically increment and read:
```js
db.counters.findOneAndUpdate(
  { _id: "bookingId" },
  { $inc: { seq: 1 } },
  { returnDocument: "after", upsert: true }
)
// then format as: "TW" + String(seq).padStart(4, "0")  →  "TW0003"
```

---

## Migration Steps

> Run these in order against the existing `test` database. Take a backup first.

### Step 1 — Rename `primarycontacts` → `contacts`
```js
db.primarycontacts.renameCollection("contacts")
```

### Step 2 — Add new fields to `contacts` with defaults
```js
db.contacts.updateMany(
  {},
  {
    $rename: { "contactPhoneNo": "contactPhoneNo" }, // already correct
    $set: {
      assignedGroup: null,
      status: "Pending",
      interested: null,
      assignedToUserId: null
    }
  }
)
```

### Step 3 — Migrate `bookings`: rename `primaryContactId` → `contactId`
```js
db.bookings.updateMany(
  { primaryContactId: { $exists: true } },
  [{ $set: { contactId: "$primaryContactId" } }]
)
db.bookings.updateMany({}, { $unset: { primaryContactId: "" } })
```

### Step 4 — Extract flight data from `bookings` into `segments`
```js
// Run this script to migrate each booking's flat flight fields into segment documents
db.bookings.find({
  $or: [{ flightFrom: { $ne: null } }, { flightTo: { $ne: null } }]
}).forEach(booking => {
  const seg = {
    bookingId: booking._id,
    legNumber: 1,
    flightFrom: booking.flightFrom || null,
    flightTo: booking.flightTo || null,
    departureTime: booking.travelDate || null,
    arrivalTime: null,
    returnDepartureTime: booking.returnDate || null,
    returnArrivalTime: null
  }
  db.segments.insertOne(seg)
})

// Then remove the flat fields from bookings
db.bookings.updateMany({}, {
  $unset: {
    flightFrom: "",
    flightTo: "",
    travelDate: "",
    returnDate: "",
    destination: ""
  }
})
```

### Step 5 — Extract flight data from `passengers` into `segments` (if populated)
```js
// Passengers had duplicate flightFrom/flightTo — strip them
db.passengers.updateMany({}, {
  $unset: {
    flightFrom: "",
    flightTo: "",
    tripType: "",
    departureTime: "",
    arrivalTime: "",
    returnDate: "",
    returnDepartureTime: "",
    returnArrivalTime: ""
  }
})
```

### Step 6 — Migrate embedded cost arrays into `costs` collection
```js
db.bookings.find({
  $or: [
    { estimatedCosts: { $exists: true, $not: { $size: 0 } } },
    { actualCosts: { $exists: true, $not: { $size: 0 } } }
  ]
}).forEach(booking => {
  const toInsert = []
  ;(booking.estimatedCosts || []).forEach(c => {
    toInsert.push({ bookingId: booking._id, costType: c.type, price: c.price || 0, supplierId: null, costKind: "estimated", createdAt: new Date() })
  })
  ;(booking.actualCosts || []).forEach(c => {
    toInsert.push({ bookingId: booking._id, costType: c.type, price: c.price || 0, supplierId: null, costKind: "actual", createdAt: new Date() })
  })
  if (toInsert.length) db.costs.insertMany(toInsert)
})

// Remove embedded arrays from bookings
db.bookings.updateMany({}, {
  $unset: { estimatedCosts: "", actualCosts: "" }
})
```

### Step 7 — Remove `travellers` field from `bookings` (now fully in `passengers`)
```js
db.bookings.updateMany({}, { $unset: { travellers: "" } })
```

### Step 8 — Drop unused collections
```js
db.missedcalls.drop()
db.notifications.drop()
```

### Step 9 — Create all indexes

> See the full **Indexing Strategy** section at the bottom of this document for the reasoning behind every index. Run all of these after migration is confirmed working.

```js
// ─── contacts ───────────────────────────────────────────────
db.contacts.createIndex({ contactPhoneNo: 1 })
db.contacts.createIndex(
  { status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 }
)
db.contacts.createIndex({ assignedToUserId: 1, createdAt: -1 })
db.contacts.createIndex({ createdAt: -1 })

// ─── bookings ───────────────────────────────────────────────
db.bookings.createIndex({ uniqueCode: 1 }, { unique: true })
db.bookings.createIndex({ contactId: 1, createdAt: -1 })
db.bookings.createIndex({ assignedToUserId: 1, createdAt: -1 })
db.bookings.createIndex({ verified: 1, createdAt: -1 })

// ─── child collections (always queried by bookingId) ────────
db.segments.createIndex({ bookingId: 1, legNumber: 1 })
db.passengers.createIndex({ bookingId: 1 })
db.costs.createIndex({ bookingId: 1, costKind: 1 })
db.payments.createIndex({ bookingId: 1 })
db.comments.createIndex({ bookingId: 1, createdAt: -1 })
db.comments.createIndex({ contactId: 1, createdAt: -1 })

// ─── lookup collections ─────────────────────────────────────
db.suppliers.createIndex({ category: 1, name: 1 })
db.users.createIndex({ role: 1, isOnline: 1 })
```

---

## API / Backend Logic Changes Required

### New booking (Stage 1)
- `POST /contacts` — creates a new contact document with `status: "Pending"`
- Do **not** create a booking document at this point

### Update lead (Stage 2)
- `PATCH /contacts/:id` — updates `status`, `interested`, `assignedGroup`, `assignedToUserId`
- `POST /comments` — inserts remark with `contactId`, `bookingId: null` if no booking yet

### Finalize booking (Stage 3)
1. Atomically increment `counters` and format `uniqueCode`
2. `POST /bookings` — create booking linked to `contactId`
3. `POST /segments` (1 or more) — insert flight legs
4. `POST /passengers` (1 per traveler)
5. `POST /costs` (1 per cost row, with `costKind: "estimated"` or `"actual"`)
6. `POST /payments` (1 per payment received)

### Margin calculation
- Do **not** store `estimatedMargin` and `netMargin` as static values if possible — compute on read:
  ```
  estimatedMargin = lumpSumAmount - SUM(costs where costKind="estimated")
  netMargin       = lumpSumAmount - SUM(costs where costKind="actual")
  outstanding     = lumpSumAmount - SUM(payments.amount)
  ```
- If you need them stored for sorting/filtering on the dashboard, recalculate and update on every cost or payment write.

### Unique code generation (safe concurrent pattern)
```js
async function generateUniqueCode() {
  const result = await db.collection("counters").findOneAndUpdate(
    { _id: "bookingId" },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  )
  return "TW" + String(result.seq).padStart(4, "0")
}
```

---

## Final Collection List

| Collection | Purpose |
|---|---|
| `contacts` | All leads — Stage 1 & 2 data |
| `bookings` | Finalized deals — Stage 3 header |
| `segments` | Per-leg flight data |
| `passengers` | Per-traveler identity data |
| `costs` | Per-item cost rows (estimated & actual) |
| `payments` | Per-transaction payment records |
| `comments` | Activity log / remarks |
| `suppliers` | Admin-managed provider list |
| `users` | CRM user accounts |
| `crmsettings` | Admin-managed dropdown values |
| `counters` | Auto-increment sequences |

---

## Indexing Strategy

> This section explains every index: what query it serves, why it's compound, and the read/write tradeoff. Give this to your coding agent so it understands the intent, not just the commands.

### Core principle: index for your actual queries

Every index speeds up reads but slows down writes slightly (MongoDB must update the index on every insert/update). The goal is: add indexes for every high-frequency read pattern, avoid indexes on fields that are only ever written and never filtered.

---

### `contacts` indexes

#### 1. Phone number lookup
```js
db.contacts.createIndex({ contactPhoneNo: 1 })
```
**Query it serves:** `db.contacts.findOne({ contactPhoneNo: "+919888844882" })`
**Why:** Every new booking starts by searching if the contact already exists by phone. Without this index, MongoDB scans every document. With it, it's an instant B-tree lookup.
**Write cost:** Very low — phone number never changes after creation.

---

#### 2. Dashboard leads table filter + sort
```js
db.contacts.createIndex(
  { status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 }
)
```
**Query it serves:**
```js
db.contacts.find({
  status: "Pending",
  assignedGroup: "LCC",
  assignedToUserId: ObjectId("...")
}).sort({ createdAt: -1 })
```
**Why compound:** The dashboard always filters by some combination of status + group + agent, then sorts newest-first. A compound index on all four fields in this order means MongoDB can satisfy the entire query — filter AND sort — from one index scan with zero in-memory sort. If you had separate single-field indexes, MongoDB could only use one and would still do a full sort.

**Field order matters:**
- `status` first — highest cardinality filter (agents always filter by status)
- `assignedGroup` second — narrows further
- `assignedToUserId` third — agent-specific view
- `createdAt: -1` last — sort direction, must be `-1` (descending) to avoid in-memory sort

**Write cost:** Medium — status and group change on every Stage 2 edit. Acceptable because the dashboard read is the most frequent operation in the whole CRM.

---

#### 3. Agent-specific view (without status filter)
```js
db.contacts.createIndex({ assignedToUserId: 1, createdAt: -1 })
```
**Query it serves:** "Show me all my leads regardless of status", sorted newest-first.
**Why separate:** Index #2 requires `status` as the leading field — if the query omits `status`, MongoDB cannot use it efficiently. This index covers the agent-only query.

---

#### 4. Global newest-first (admin view)
```js
db.contacts.createIndex({ createdAt: -1 })
```
**Query it serves:** Admin sees all leads sorted by date, no filters.
**Why:** Without this, sorting all contacts by `createdAt` requires a full collection scan + in-memory sort — the slowest possible path.

---

### `bookings` indexes

#### 5. Unique booking code
```js
db.bookings.createIndex({ uniqueCode: 1 }, { unique: true })
```
**Query it serves:** `db.bookings.findOne({ uniqueCode: "TW0003" })`
**Why unique:** Enforces at the database level that two bookings can never get the same code, even if there's a race condition in the counter logic. The `{ unique: true }` option makes MongoDB reject the insert if a duplicate appears.
**Write cost:** Low — uniqueCode is set once at creation and never changes.

---

#### 6. All bookings for a contact
```js
db.bookings.createIndex({ contactId: 1, createdAt: -1 })
```
**Query it serves:** Opening a contact's detail page → fetch all their bookings newest-first.
**Why:** This is the most common booking query. `contactId` must be the leading field since that's the filter; `createdAt: -1` satisfies the sort without a second pass.

---

#### 7. Bookings by agent
```js
db.bookings.createIndex({ assignedToUserId: 1, createdAt: -1 })
```
**Query it serves:** Agent dashboard — "all bookings assigned to me".

---

#### 8. Verification queue
```js
db.bookings.createIndex({ verified: 1, createdAt: -1 })
```
**Query it serves:** Admin verification queue — `{ verified: false }` sorted by oldest-first to process in order.
**Why:** Without this, finding unverified bookings requires scanning every booking document.

---

### Child collection indexes (`segments`, `passengers`, `costs`, `payments`, `comments`)

All child collections follow the same pattern: they are **always** queried by `bookingId`. There is never a reason to fetch segments without knowing the bookingId first.

#### 9. Segments ordered by leg
```js
db.segments.createIndex({ bookingId: 1, legNumber: 1 })
```
**Why compound:** `legNumber: 1` ascending means MongoDB returns leg 1, leg 2, leg 3 in order with no sort step. Fetching segments out of order and sorting in application code is wasteful.

#### 10. Costs filtered by kind
```js
db.costs.createIndex({ bookingId: 1, costKind: 1 })
```
**Query it serves:**
```js
// Estimated margin calculation
db.costs.find({ bookingId: id, costKind: "estimated" })
// Net margin calculation
db.costs.find({ bookingId: id, costKind: "actual" })
```
**Why compound:** You never want ALL costs — you always want either estimated or actual. Including `costKind` in the index means MongoDB reads only the matching subset directly from the index, not the full costs list.

#### 11. Comments — dual index
```js
db.comments.createIndex({ bookingId: 1, createdAt: -1 })
db.comments.createIndex({ contactId: 1, createdAt: -1 })
```
**Why two indexes:** A remark added at Stage 2 (before a booking exists) has `bookingId: null` and only `contactId`. A remark added at Stage 3+ has both. The two indexes ensure fast retrieval in both cases — the contact timeline and the booking activity feed are separate views.

---

### `suppliers` index

```js
db.suppliers.createIndex({ category: 1, name: 1 })
```
**Query it serves:** Cost row source dropdown — "show me all Air Ticket suppliers" sorted alphabetically.
**Why compound:** `category` first filters to the right type, `name: 1` sorts alphabetically with no extra step.

---

### `users` index

```js
db.users.createIndex({ role: 1, isOnline: 1 })
```
**Query it serves:** "Show online agents" for the assign-to-agent dropdown.
**Why:** Small collection but queried on every Stage 2 edit when building the agent dropdown.

---

### What NOT to index

| Field | Why not |
|---|---|
| `bookings.lumpSumAmount` | Never filtered, only displayed |
| `bookings.companyName` | Filtered via crmsettings dropdown, not a direct query field |
| `passengers.name` | Searched within a known booking — bookingId index covers it |
| `costs.price` | Never queried directly, only summed after bookingId filter |
| `comments.text` | Full-text search would need a text index, not a regular one — add only if search feature is built |
| `contacts.requirements` | Same — free text, not a filter field |

---

### Index build note for production

If you are adding indexes to an existing live database with data already in it, use the `background` option (MongoDB 4.x) or the default non-blocking build (MongoDB 5+) so the database stays available during the build:

```js
// MongoDB 4.x only — not needed on 5+
db.contacts.createIndex(
  { status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 },
  { background: true }
)
```

On MongoDB Atlas (which your screenshots show), indexes build online automatically — no extra option needed.
