# 📡 API Reference

> Complete reference of every API endpoint with request/response examples.

---

## Authentication

All endpoints except `/api/auth/login`, `/api/external/lead`, and `/api/webhook/missed-call` require a JWT token in the header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Auth Routes — `/api/auth`

### POST `/api/auth/login`
**Access:** Public

**Request:**
```json
{
  "email": "admin@travel.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "id": "64abc...",
  "name": "System Admin",
  "email": "admin@travel.com",
  "role": "ADMIN",
  "isOnline": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):** `"Invalid email or password"`

---

### GET `/api/auth/seed`
**Access:** Public (⚠️ Temporary — remove in production!)

Wipes all users and re-creates Admin + Agent demo accounts.

---

## 📋 Booking Routes — `/api/bookings`

> All routes require `protect` middleware (JWT).

### GET `/api/bookings/stats`
**Access:** All authenticated

Returns count of bookings by status. Scoped by role (Agents see only assigned, Marketers see only created).

**Response:**
```json
{
  "total": 150,
  "booked": 30,
  "pending": 50,
  "working": 40,
  "sent": 30
}
```

---

### GET `/api/bookings/recent`
**Access:** All authenticated

Returns latest 5 bookings (lightweight, for dashboard).

---

### GET `/api/bookings/calendar?month=3&year=2026`
**Access:** All authenticated

Returns bookings with travel dates in the specified month for calendar display.

**Response:**
```json
[
  {
    "id": "64abc...",
    "title": "John Smith",
    "date": "2026-03-15T00:00:00.000Z",
    "status": "Booked",
    "destination": "Dubai"
  }
]
```

---

### POST `/api/bookings/bulk-assign`
**Access:** ADMIN only

Assigns multiple bookings to an agent at once.

**Request:**
```json
{
  "bookingIds": ["64abc...", "64def..."],
  "assignedToUserId": "64xyz..."  // or null to unassign
}
```

---

### GET `/api/bookings`
**Access:** All authenticated

Returns paginated booking list with filters.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 10) |
| `status` | String | Comma-separated: `Pending,Working,Sent,Booked,Interested,Not Interested` |
| `assignedTo` | String | User ID to filter by assigned agent |
| `search` | String | Search in contact name, phone, requirements, flight cities |
| `fromDate` | ISO Date | Filter by creation date (start) |
| `toDate` | ISO Date | Filter by creation date (end) |
| `travelDateFilter` | String | `upcoming_7_days`, `upcoming_10_days`, `upcoming_15_days`, `upcoming_30_days` |
| `myBookings` | String | `true` — show only user's bookings |

**Response:**
```json
{
  "data": [
    {
      "id": "64abc...",
      "uniqueCode": "TW0042",
      "status": "Pending",
      "contactPerson": "John Smith",
      "contactNumber": "+91xxxxxxxxxx",
      "bookingType": "B2C",
      "flightFrom": "Delhi",
      "flightTo": "Dubai",
      "destination": "Dubai",
      "travelDate": "2026-03-15",
      "travellers": 2,
      "amount": 50000,
      "assignedToUser": { "name": "Agent 1" },
      "createdByUser": { "name": "Marketer 1" },
      "createdAt": "2026-03-10T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### POST `/api/bookings`
**Access:** All authenticated

Creates a new booking. Also creates a PrimaryContact record.

**Request:**
```json
{
  "contactPerson": "John Smith",
  "contactNumber": "+919876543210",
  "bookingType": "B2C",
  "destination": "Dubai",
  "travelDate": "2026-03-15",
  "requirements": "Need 2 tickets to Dubai from Delhi on March 15",
  "flightFrom": "Delhi",
  "flightTo": "Dubai",
  "tripType": "one-way",
  "amount": 50000,
  "travellers": 2
}
```

> NLP auto-extracts `destination`, `travelDate`, and `travellers` from `requirements` if not provided.

---

### GET `/api/bookings/:id`
**Access:** All authenticated (MARKETER restricted to own bookings)

Returns full booking with populated contacts, comments, passengers, payments.

---

### PUT `/api/bookings/:id`
**Access:** ADMIN, AGENT (assigned), MARKETER (only requirements field)

**Request (any subset):**
```json
{
  "destination": "Singapore",
  "travelDate": "2026-04-01",
  "requirements": "Updated requirements text",
  "amount": 75000,
  "interested": "Yes",
  "tripType": "round-trip",
  "segments": [
    { "from": "Delhi", "to": "Singapore", "date": "2026-04-01" },
    { "from": "Singapore", "to": "Delhi", "date": "2026-04-10" }
  ]
}
```

---

### DELETE `/api/bookings/:id`
**Access:** ADMIN only

Deletes the booking AND all related comments, passengers, payments, notifications, and primary contact.

---

### PATCH `/api/bookings/:id/status`
**Access:** ADMIN, AGENT (assigned only)

**Request:**
```json
{
  "status": "Working"
}
```
Valid values: `Pending`, `Working`, `Sent`, `Booked`

> Creates a notification for the Marketer if their lead's status changes.

---

### PATCH `/api/bookings/:id/assign`
**Access:** Any authenticated (typically ADMIN)

**Request:**
```json
{
  "assignedToUserId": "64xyz..."
}
```
Set to `null` to unassign. Creates auto-comment and notifications.

---

### POST `/api/bookings/:id/comments`
**Access:** ADMIN, AGENT (assigned only), MARKETER

**Request:**
```json
{
  "text": "Customer confirmed travel dates"
}
```

---

### GET `/api/bookings/:id/comments`
**Access:** All authenticated

---

### POST `/api/bookings/:id/passengers`
**Access:** ADMIN, AGENT (assigned only)

**Request (array):**
```json
[
  {
    "name": "John Smith",
    "phoneNumber": "+919876543210",
    "email": "john@example.com",
    "dob": "1990-05-15",
    "country": "UAE",
    "flightFrom": "Delhi",
    "flightTo": "Dubai",
    "departureTime": "10:00",
    "arrivalTime": "14:00",
    "tripType": "round-trip",
    "returnDate": "2026-03-25",
    "returnDepartureTime": "16:00",
    "returnArrivalTime": "20:00"
  }
]
```

---

### PUT `/api/bookings/:id/passengers`
**Access:** ADMIN, AGENT (assigned only)

Same format as POST. **Replaces ALL existing passengers** (delete + re-insert).

---

### POST `/api/bookings/:id/payments`
**Access:** ADMIN, AGENT (assigned only)

**Request:**
```json
{
  "amount": 25000,
  "paymentMethod": "UPI",
  "transactionId": "TXN123456",
  "remarks": "First installment",
  "date": "2026-03-12"
}
```

---

### GET `/api/bookings/:id/payments`
**Access:** All authenticated

---

### DELETE `/api/bookings/:id/payments/:paymentId`
**Access:** ADMIN, AGENT (assigned only)

---

### GET `/api/bookings/:id/activity`
**Access:** All authenticated

Returns activity log entries for a booking (status changes, assignments, etc.)

---

## 👤 User Routes — `/api/users`

### GET `/api/users/agents`
**Access:** All authenticated

Returns list of agents (for assignment dropdowns). Cached 60s.

---

### GET `/api/users`
**Access:** ADMIN only

Returns all users with details.

---

### POST `/api/users`
**Access:** ADMIN only

**Request:**
```json
{
  "name": "New Agent",
  "email": "newagent@travel.com",
  "password": "password123",
  "role": "AGENT"
}
```
Valid roles: `ADMIN`, `AGENT`, `MARKETER`

---

### PUT `/api/users/:id`
**Access:** ADMIN only

Update user name, email, role, or reset password.

---

### DELETE `/api/users/:id`
**Access:** ADMIN only

Cannot delete yourself or the last admin.

---

### PUT `/api/users/change-password`
**Access:** All authenticated

```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

---

### PUT `/api/users/profile`
**Access:** All authenticated

Returns a new JWT token (since payload contains name/email).

---

### PATCH `/api/users/status`
**Access:** All authenticated

```json
{ "isOnline": true }
```

---

### POST `/api/users/:id/unassign-bookings`
**Access:** ADMIN only

Unassigns Pending/Working bookings from a specific user.

---

### POST `/api/users/unassign-offline-bookings`
**Access:** ADMIN only

```json
{ "timeThresholdMinutes": 1440 }
```
Unassigns bookings from agents who are offline.

---

## 📊 Analytics Routes — `/api/analytics`

> All routes: ADMIN only.

### GET `/api/analytics/bookings?fromDate=...&toDate=...`
Returns booking breakdown by status, trip type, and interest.

### GET `/api/analytics/payments?fromDate=...&toDate=...`
Returns total collected, expected, balance, and payment count.

### GET `/api/analytics/revenue-trends?interval=month`
Returns revenue grouped by month or day.

### GET `/api/analytics/agents?fromDate=...&toDate=...`
Returns per-agent performance: total bookings, converted, revenue, conversion rate.

---

## 🔄 Sync Route — `/api/sync`

### GET `/api/sync`
**Access:** All authenticated

Single endpoint that returns dashboard data:
```json
{
  "stats": { "total": 150, "booked": 30, "pending": 50, "working": 40, "sent": 30, "agents": 5 },
  "recentBookings": [...],
  "notifications": [...]
}
```
Cached 30s. Scoped by user role.

---

## 🔔 Notification Routes — `/api/notifications`

### GET `/api/notifications`
Returns user's latest 20 notifications. Cached 30s.

### PUT `/api/notifications/:id/read`
Marks a notification as read.

---

## 🌐 External Routes — `/api/external`

### POST `/api/external/lead`
**Access:** Public (protected by API key)

**Required Header:**
```
X-API-KEY: <value of EXTERNAL_API_KEY env var>
```

**Request (v4.0 — raw fields):**
```json
{
  "raw_fields": [
    { "key": "name_1", "label": "Name", "value": "John Smith" },
    { "key": "phone_2", "label": "Phone", "value": "+441234567890" },
    { "key": "email_3", "label": "Email", "value": "john@example.com" },
    { "key": "from_4", "label": "From", "value": "London" },
    { "key": "to_5", "label": "To", "value": "Dubai" },
    { "key": "departure_6", "label": "Departure", "value": "15/03/2026" },
    { "key": "adult_7", "label": "Adult", "value": "2" }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "bookingId": "64abc...",
  "uniqueCode": "TW0043"
}
```

---

## 📞 Webhook Routes — `/api/webhook`

### POST `/api/webhook/missed-call`
**Access:** Public (protected by HTTP Basic Auth)

**Required Header:**
```
Authorization: Basic <base64(GDMS_WEBHOOK_USER:GDMS_WEBHOOK_PASS)>
```

**Request (GDMS CDR format):**
```json
{
  "cdr_root": [
    {
      "src": "9876543210",
      "caller_name": "Customer Name",
      "dst": "1004",
      "start": "2026-04-18 12:00:00",
      "end": "2026-04-18 12:00:15",
      "duration": "15",
      "billsec": "0",
      "disposition": "NO ANSWER",
      "uniqueid": "1713427200.42",
      "channel": "PJSIP/1004",
      "userfield": "Internal"
    }
  ]
}
```

**Supported payload formats:**
- `{ "cdr_root": [...] }` — standard GDMS format
- `[{...}, {...}]` — flat array
- `{...}` — single CDR object
- `{ "<any_key>": [...] }` — auto-detected array inside payload

**Response (200):**
```json
{
  "success": true,
  "message": "Processed 1 CDR records",
  "integrated": 1,
  "skipped": 0
}
```

**Behavior:**
- Filters out `ANSWERED` calls (only processes missed/busy/failed)
- Deduplicates by `uniqueid` — same CDR won't be processed twice
- **Known number**: Adds comment to existing lead + notifies assigned agent
- **Unknown number**: Creates new lead (status: `Pending`, created by `Phone Lead`)

> ⚠️ Returns `401` if Basic Auth credentials are missing or incorrect.

---

## 🏥 Health Check Routes

| Route | Response |
|---|---|
| `GET /` | `"Travel CRM Backend API is running..."` |
| `GET /health` | `"OK"` |
| `GET /api/ping` | `"pong"` |
| `GET /test-db` | `{ "message": "MongoDB connected successfully", "host": "..." }` |
