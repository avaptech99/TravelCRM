# 🔧 Backend Guide

> Complete guide to the backend codebase: `travel-crm-backend/`

---

## Table of Contents

1. [Entry Point & Server Setup](#1-entry-point--server-setup)
2. [Database Connection](#2-database-connection)
3. [Authentication System](#3-authentication-system)
4. [Models (Database Schema)](#4-models-database-schema)
5. [Controllers (Business Logic)](#5-controllers-business-logic)
6. [Routes](#6-routes)
7. [Utilities](#7-utilities)
8. [Caching Strategy](#8-caching-strategy)
9. [WordPress Integration](#9-wordpress-integration)
10. [Performance & Monitoring](#10-performance--monitoring)
11. [How To Add a New Feature](#11-how-to-add-a-new-feature)

---

## 1. Entry Point & Server Setup

**File:** `src/server.ts`

This is the main entry point. Here's what it does in order:

1. Loads environment variables via `dotenv`
2. Connects to MongoDB via `connectDB()`
3. Sets up middleware: `compression`, `express.json()`, `cors`, `morgan`
4. Mounts all route groups on `/api/*`
5. Adds health check endpoints (`/api/ping`, `/health`, `/test-db`)
6. **Auto-seeds an admin user** if the database is empty (first-time setup)
7. Starts listening on port (default 5000)
8. Starts self-pinging if `BASE_URL` is set (keeps Render free-tier awake)

### CORS Configuration
Currently allows **all origins** in production. In development, restricts to `localhost`. This is intentionally permissive — if you need to lock it down, edit the `origin` callback in `server.ts`.

### Important Notes
- The error handler middleware at the bottom catches all unhandled errors and returns clean JSON
- Stack traces are only shown in development mode
- The auto-seeder creates `admin@travel.com` / `admin123` as the default login

---

## 2. Database Connection

**File:** `src/config/db.ts`

- Uses Mongoose to connect to MongoDB Atlas
- Supports both `MONGODB_URI` and `DATABASE_URL` env vars
- Pool configuration optimized for free-tier hosting:
  - `maxPoolSize: 5` — limits concurrent connections
  - `minPoolSize: 2` — keeps minimum connections ready
  - `serverSelectionTimeoutMS: 5000` — fast-fail if Atlas is unreachable

---

## 3. Authentication System

### How It Works

```
Login Request (email + password)
    │
    ▼
authController.loginUser()
    │
    ├── Validates input with Zod schema
    ├── Finds user by email (lean query, selected fields only)
    ├── Compares password with bcrypt
    ├── Auto-upgrades bcrypt rounds if needed (from 10→8 for perf)
    ├── Generates JWT with { id, name, email, role }
    └── Returns JWT token to client
```

### Files Involved
| File | Purpose |
|---|---|
| `controllers/authController.ts` | Login logic |
| `middleware/auth.ts` | JWT verification middleware |
| `utils/jwt.ts` | Token generation & verification |
| `utils/password.ts` | Password hashing, comparison, round checking |

### JWT Token Payload
```typescript
{
  id: string;      // MongoDB User _id
  role: string;     // 'ADMIN' | 'AGENT' | 'MARKETER'
  name: string;     // Display name
  email: string;    // User email
}
```
- Token expires in **30 days**
- Token is sent in `Authorization: Bearer <token>` header
- The `protect` middleware extracts user info from the JWT — **no database lookup needed** per request

### Middleware
- **`protect`**: Validates JWT token. Attaches `req.user` with decoded payload. Returns 401 if invalid/missing.
- **`adminGuard`**: Checks `req.user.role === 'ADMIN'`. Returns 403 if not admin. Must be used **after** `protect`.

---

## 4. Models (Database Schema)

### Relationships Overview

```
User ─┐
      │ createdByUserId / assignedToUserId
      ▼
Booking ◄─── PrimaryContact (1:1 via primaryContactId)
   │
   ├──── Comment[] (1:many via bookingId)
   ├──── Passenger[] (1:many via bookingId)
   ├──── Payment[] (1:many via bookingId)
   ├──── Activity[] (1:many via bookingId)
   └──── Notification[] (1:many via bookingId)

Counter (standalone — auto-increment for booking codes)
```

### Model Details

#### `User`
| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Required, unique |
| passwordHash | String | bcrypt hash |
| role | String | `ADMIN`, `AGENT`, or `MARKETER` |
| isOnline | Boolean | Tracks login status |
| lastSeen | Date | Last activity timestamp |

#### `PrimaryContact`
| Field | Type | Notes |
|---|---|---|
| contactName | String | Required |
| contactPhoneNo | String | Required |
| contactEmail | String | Optional |
| bookingType | String | `Agent (B2B)` or `Direct (B2C)` |
| requirements | String | Detailed text from customer |
| interested | String | `Yes` or `No` |

#### `Booking` (Core Entity)
| Field | Type | Notes |
|---|---|---|
| primaryContactId | ObjectId → PrimaryContact | Required link to contact |
| uniqueCode | String | Auto-generated: TW0001, TW0002... |
| destination | String | City/country (may be AI-extracted) |
| travelDate | Date | May be AI-extracted from requirements |
| returnDate | Date | For round trips |
| flightFrom | String | Origin airport/city |
| flightTo | String | Destination airport/city |
| tripType | String | `one-way`, `round-trip`, `multi-city` |
| segments | Array | `[{from, to, date}]` for multi-city |
| amount | Number | Total quoted amount |
| totalAmount | Number | Grand total |
| finalQuotation | String | Final quotation text/reference |
| travellers | Number | AI-extracted or manual count |
| status | String | `Pending` → `Working` → `Sent` → `Booked` |
| createdByUserId | ObjectId → User | Who created it |
| assignedToUserId | ObjectId → User | Who's working on it |

**Virtual properties** (populated on-the-fly): `assignedToUser`, `createdByUser`, `primaryContact`, `comments`, `payments`, `passengers`

**Indexes:** `createdAt`, `status`, `assignedToUserId`, `createdByUserId`, `primaryContactId`

#### `Passenger`
| Field | Type | Notes |
|---|---|---|
| bookingId | ObjectId → Booking | Required |
| name | String | Required |
| phoneNumber, email | String | Optional |
| dob, anniversary | String | Date strings |
| country | String | Destination country |
| flightFrom, flightTo | String | Per-passenger flight |
| departureTime, arrivalTime | String | Time strings |
| tripType | String | Per-passenger trip type |
| returnDate, returnDepartureTime, returnArrivalTime | String | Return flight details |

#### `Payment`
| Field | Type | Notes |
|---|---|---|
| bookingId | ObjectId → Booking | Required |
| amount | Number | Payment amount |
| paymentMethod | String | e.g., "UPI", "Cash", "Bank Transfer" |
| transactionId | String | Optional reference number |
| remarks | String | Optional notes |
| date | Date | Payment date |

#### `Comment`
| Field | Type | Notes |
|---|---|---|
| bookingId | ObjectId → Booking | Required |
| createdById | ObjectId → User | Who wrote it |
| text | String | Comment content |
| createdAt | Date | Timestamp |

**Special:** Agent reassignment creates an automatic comment like `"Agent A ➔ Agent B"`

#### `Activity`
| Field | Type | Notes |
|---|---|---|
| bookingId | ObjectId → Booking | Required |
| userId | ObjectId → User | Who performed the action |
| action | String | e.g., `STATUS_CHANGE`, `ASSIGNED`, `TRAVELER_ADDED` |
| details | String | Description of what changed |

#### `Notification`
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | Recipient |
| bookingId | ObjectId → Booking | Related booking (optional) |
| message | String | Notification text |
| read | Boolean | Read status |

#### `Counter`
| Field | Type | Notes |
|---|---|---|
| _id | String | Name of sequence (e.g., `bookingId`) |
| seq | Number | Current counter value |

---

## 5. Controllers (Business Logic)

### `bookingController.ts` (~1100 lines) — THE MAIN FILE

This is the largest and most important file. Here's what each function does:

| Function | Route | What It Does |
|---|---|---|
| `getBookingStats` | GET /stats | Returns status counts {total, booked, pending, working, sent}. Cached 120s. |
| `getRecentBookings` | GET /recent | Returns latest 5 bookings for dashboard. Cached 60s. |
| `getBookings` | GET / | Full booking list with search, filtering, pagination. Cached 60s. |
| `getBookingById` | GET /:id | Single booking with all populated data. Cached 60s. |
| `createBooking` | POST / | Creates PrimaryContact + Booking. Runs NLP extraction. |
| `updateBooking` | PUT /:id | Updates booking and/or PrimaryContact fields. Role-restricted. |
| `deleteBooking` | DELETE /:id | **ADMIN ONLY.** Deletes booking + all comments, passengers, payments. |
| `updateBookingStatus` | PATCH /:id/status | Changes status. Notifies marketer if their lead changes. |
| `assignBooking` | PATCH /:id/assign | Assigns agent. Creates auto-comment. Notifies new agent + marketer. |
| `bulkAssign` | POST /bulk-assign | **ADMIN ONLY.** Assigns multiple bookings at once. |
| `addComment` | POST /:id/comments | Adds remark. Notifies assigned agent if marketer comments. |
| `getComments` | GET /:id/comments | Returns all comments for a booking. |
| `addPassengers` | POST /:id/passengers | Creates passenger records. |
| `updatePassengers` | PUT /:id/passengers | Replaces all passengers (delete existing + insert new). |
| `addPayment` | POST /:id/payments | Records a payment. |
| `getPayments` | GET /:id/payments | Returns all payments for a booking. |
| `deletePayment` | DELETE /:id/payments/:paymentId | Deletes a specific payment. |
| `getCalendarBookings` | GET /calendar | Returns bookings for a specific month (for calendar view). |
| `getBookingActivity` | GET /:id/activity | Returns activity log for a booking. |

### `userController.ts`

| Function | Route | What It Does |
|---|---|---|
| `getAgents` | GET /agents | Returns list of agents (cached 60s) |
| `getAllUsers` | GET / | Returns all users (admin only, cached 60s) |
| `createUser` | POST / | Creates new user (admin only) |
| `deleteUser` | DELETE /:id | Deletes user, prevents deleting self or last admin |
| `changePassword` | PUT /change-password | User changes own password |
| `updateProfile` | PUT /profile | Updates name/email, returns new JWT |
| `updateUserById` | PUT /:id | Admin edits any user (name, email, role, password) |
| `updateStatus` | PATCH /status | Sets online/offline status |
| `unassignOfflineBookings` | POST /unassign-offline-bookings | Unassigns pending bookings from offline agents |
| `unassignUserBookings` | POST /:id/unassign-bookings | Unassigns a specific user's bookings |

### `analyticsController.ts`

| Function | Route | What It Does |
|---|---|---|
| `getBookingAnalytics` | GET /bookings | Breakdown by status, trip type, and interest |
| `getPaymentAnalytics` | GET /payments | Total collected vs. expected + balance |
| `getRevenueTrends` | GET /revenue-trends | Revenue grouped by month or day |
| `getAgentAnalytics` | GET /agents | Per-agent: total bookings, conversions, revenue |

### `syncController.ts`

Single `getGlobalSync` function that consolidates:
- Booking stats (aggregate query)
- Recent bookings (latest 5)
- Notifications (latest 20)
- Agent count (admin only)

All queries run in **parallel** via `Promise.all`. Result cached for 30 seconds.

### `externalController.ts`

`createExternalLead` — Handles WordPress form submissions:
1. Validates API key
2. Parses `raw_fields` array (label-based field detection)
3. Handles multi-city repeater data (flat object with `X.Y_Z` keys)
4. Normalizes trip type
5. Generates detailed requirements text
6. Creates PrimaryContact + Booking
7. Assigns to "Website Lead" system user

### `notificationController.ts`

- `getMyNotifications` — Returns user's latest 20 notifications (cached 30s)
- `markNotificationAsRead` — Marks single notification as read, invalidates cache

### `webhookController.ts`

Handles incoming **GDMS (Grandstream PBX)** CDR webhooks:

| Function | Route | What It Does |
|---|---|---|
| `receiveMissedCall` | POST /missed-call | Receives CDR payload from GDMS PBX, filters for missed calls, integrates into CRM |

**Flow:**
1. Validates HTTP Basic Auth credentials (`GDMS_WEBHOOK_USER` / `GDMS_WEBHOOK_PASS` env vars)
2. Parses flexible CDR payload (supports `cdr_root` array, flat array, single object)
3. Filters: Only processes calls with `disposition !== 'ANSWERED'` (missed/busy/failed)
4. Deduplicates by `uniqueId` — skips already-processed CDRs
5. For each missed call:
   - **Existing contact** → Adds comment to latest booking (e.g., `Miss Call from Anmoldeep , 14:15 18/4/2026`) + notifies the assigned agent
   - **New number** → Creates a new `PrimaryContact` + `Booking` (status: `Pending`, created by system user `Phone Lead`)
6. Saves record in `MissedCall` collection as audit log with `isProcessed: true`

**System User — "Phone Lead":**
A dedicated system account (`phone-lead@system.internal`) is auto-created on first use. It acts as the `createdByUserId` for all automated leads. It has no real password and cannot log in.

---

## 6. Routes

### Route Mounting (in `server.ts`):
```typescript
app.use('/api/auth', authRoutes);         // Login
app.use('/api/bookings', bookingRoutes);  // All booking operations
app.use('/api/users', userRoutes);        // User management
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);         // Dashboard polling
app.use('/api/external', externalRoutes); // WordPress intake
app.use('/api/webhook', webhookRoutes);   // GDMS PBX missed call webhook
```

### Important Route Order in `bookingRoutes.ts`:
```typescript
// THESE MUST COME BEFORE /:id or Express will try to match "stats" as an ID
router.get('/stats', getBookingStats);
router.get('/recent', getRecentBookings);
router.get('/calendar', getCalendarBookings);
router.post('/bulk-assign', adminGuard, bulkAssign);

// Then the dynamic routes
router.route('/:id').get(getBookingById).put(updateBooking).delete(deleteBooking);
```

> ⚠️ **If you add new named routes like `/api/bookings/something`, add them BEFORE the `/:id` route!**

---

## 7. Utilities

### `cache.ts` — In-Memory Cache
```typescript
appCache.get<T>(key)                    // Get cached value (returns null if expired)
appCache.set<T>(key, data, ttlSeconds)  // Set with TTL
appCache.del(key)                       // Delete single key
appCache.invalidateByPrefix(prefix)     // Delete all keys starting with prefix
appCache.flush()                        // Clear everything
```

**Cache key conventions:**
- `bookings_...` — Booking lists
- `booking_<id>` — Single booking
- `stats_<userId>` — Booking stats
- `recent_<userId>` — Recent bookings
- `sync_<userId>` — Sync endpoint
- `users_agents` — Agent list
- `users_all` — All users
- `notifications_<userId>` — Notifications
- `nlp_<hash>` — NLP extraction results

### `extractTravelInfo.ts` — NLP Extraction
Takes requirement text → Returns `{ destinationCity, travelDate, travellers }`
- Uses `compromise` for place detection
- Uses `chrono-node` for date parsing
- Falls back to regex patterns for traveler count
- Results are cached for 1 hour

### `keepWarm.ts` — Server Keep-Alive
Pings the server's own BASE_URL every 10 minutes to prevent Render free-tier sleep.

### `activityLogger.ts` — Activity Log
Simple fire-and-forget function:
```typescript
await logActivity(bookingId, userId, 'STATUS_CHANGE', 'Pending → Working');
```

---

## 8. Caching Strategy

```
Write/Mutation → invalidateBookingCaches() → Clears prefixes: bookings_, stats_, recent_, booking_
                                            → Next read regenerates fresh data
Read → Check cache → Hit? Return cached → Miss? Query DB → Cache result → Return
```

**Cache TTLs:**
| Data | TTL | Reason |
|---|---|---|
| Booking stats | 120s | Rarely changes between polls |
| Recent bookings | 60s | Updated frequently enough |
| Booking list (paginated) | 60s | Balance between freshness and performance |
| Single booking | 60s | Detail views need reasonably fresh data |
| Sync endpoint | 30s | Main dashboard data source |
| Agent list | 60s | Agents rarely change |
| Notifications | 30s | Should reflect quickly |
| NLP extraction | 3600s | Same text always produces same result |

---

## 9. WordPress Integration

See `wordpress_integration_flow.md` in root for the full setup. Summary:

1. **WordPress** (PHP): Ninja Forms hook collects all submitted fields → sends as JSON to backend.
2. **Backend** (`externalController.ts`): Receives fields, maps by label keyword → creates PrimaryContact + Booking.
3. **API Key** auth: `X-API-KEY` header must match `EXTERNAL_API_KEY` env var.
4. **Multi-city trips**: Handled via repeater field parsing (flat object with `X.Y_Z` pattern).
5. **"Website Lead" user**: A system account that owns all auto-created bookings. Hidden from UI.

---

## 10. Performance & Monitoring

Based on production logs analyzed in April 2026, the system maintains high responsiveness even under load.

### Latency Benchmarks
| Operation | Average Latency | Notes |
|---|---|---|
| **Login** | 70ms | includes 65ms for `bcrypt` hashing |
| **Booking Creation** | 60ms | includes NLP extraction |
| **Sync Endpoint** | 30-50ms | Parallelized queries |
| **WordPress Intake** | 45ms | processes external leads |

### Caching Efficiency
The custom `MemoryCache` achieves a **high hit rate** for frequently accessed data:
- **Notifications**: ~90% cache hit rate (polls every 20s).
- **Dashboard Stats**: ~95% cache hit rate (consolidated sync).
- **Recent Bookings**: ~85% cache hit rate.

### Known Telemetry Issues
- **`console.time` Warning**: Frequent warnings like `Label 'getBookingById_...' already exists` appear in logs. This occurs when overlapping async requests for the same booking ID trigger `console.time` before the previous one has called `console.timeEnd`. This is a non-critical telemetry bug and does not affect data integrity.

---

## 11. How To Add a New Feature

### Adding a New API Endpoint

1. **Define the Zod schema** in `src/types/index.ts`:
```typescript
export const myNewSchema = z.object({
    fieldName: z.string().min(1),
    // ...
});
```

2. **Create the controller function** in the appropriate controller file:
```typescript
export const myNewFeature = asyncHandler(async (req: Request, res: Response) => {
    const result = myNewSchema.safeParse(req.body);
    if (!result.success) { res.status(400); throw new Error('Invalid input'); }
    // ... your logic
    invalidateBookingCaches(); // if it modifies data
    res.json(result);
});
```

3. **Add the route** in the appropriate routes file:
```typescript
router.post('/my-new-route', protect, myNewFeature);
// Or for admin-only:
router.post('/my-new-route', protect, adminGuard, myNewFeature);
```

4. **If you need a new model**, create it in `src/models/` following the existing pattern.

### Adding a New Database Model

```typescript
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMyModel extends Document {
    fieldName: string;
    // ...
}

const myModelSchema = new Schema<IMyModel>({
    fieldName: { type: String, required: true },
    // ...
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

myModelSchema.index({ fieldName: 1 }); // Add indexes!

const MyModel: Model<IMyModel> = mongoose.model<IMyModel>('MyModel', myModelSchema);
export default MyModel;
```
