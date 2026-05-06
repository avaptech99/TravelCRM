# 🗄️ Database Schema Reference

> MongoDB collections, their fields, relationships, and indexes.

---

## Entity Relationship Diagram

```
┌──────────────┐          ┌────────────────────┐
│    User      │          │  PrimaryContact    │
│──────────────│          │────────────────────│
│ _id          │◄──┐      │ _id               │
│ name         │   │      │ contactName        │
│ email        │   │      │ contactPhoneNo     │
│ passwordHash │   │      │ contactEmail       │
│ role         │   │      │ bookingType        │
│ isOnline     │   │      │ requirements       │
│ lastSeen     │   │      │ interested         │
│ createdAt    │   │      │ createdAt          │
└──────────────┘   │      │ updatedAt          │
                   │      └────────┬───────────┘
                   │               │ primaryContactId (1:1)
                   │               ▼
                   │      ┌────────────────────┐
                   │      │     Booking        │
                   │      │────────────────────│
        createdBy──┤      │ _id               │
       assignedTo──┤      │ uniqueCode (TW..) │
                   │      │ primaryContactId ──┼──► PrimaryContact
                   │      │ createdByUserId  ──┼──► User
                   │      │ assignedToUserId ──┼──► User
                   │      │ destination        │
                   │      │ travelDate         │
                   │      │ flightFrom/To      │
                   │      │ tripType           │
                   │      │ segments[]         │
                   │      │ amount             │
                   │      │ totalAmount        │
                   │      │ finalQuotation     │
                   │      │ travellers         │
                   │      │ status             │
                   │      │ createdAt          │
                   │      └────────┬───────────┘
                   │               │
        ┌──────────┼───────────────┼───────────────┬──────────────────┐
        │          │               │               │                  │
        ▼          │               ▼               ▼                  ▼
┌──────────────┐   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Comment    │   │   │  Passenger   │  │   Payment    │  │  Activity    │
│ bookingId    │   │   │ bookingId    │  │ bookingId    │  │ bookingId    │
│ createdById──┼───┘   │ name         │  │ amount       │  │ userId ──────┼──► User
│ text         │       │ phone/email  │  │ method       │  │ action       │
│ createdAt    │       │ dob/anniv    │  │ transId      │  │ details      │
└──────────────┘       │ flightDetails│  │ remarks      │  │ createdAt    │
                       │ tripType     │  │ date         │  └──────────────┘
                       │ returnFlight │  └──────────────┘
                       └──────────────┘

┌──────────────┐       ┌──────────────┐
│ Notification │       │   Counter    │
│ userId ──────┼──► User│ _id (name)  │
│ bookingId    │       │ seq (number) │
│ message      │       └──────────────┘
│ read         │
│ createdAt    │
└──────────────┘
```

---

## Collections Reference

### `users`
```javascript
{
  _id: ObjectId,
  name: "System Admin",           // Required
  email: "admin@travel.com",     // Required, unique
  passwordHash: "$2b$08$...",    // bcrypt hash
  role: "ADMIN",                  // "ADMIN" | "AGENT" | "MARKETER"
  isOnline: true,                 // Boolean
  lastSeen: ISODate("2026-03-15T10:00:00Z"),
  createdAt: ISODate("2026-03-01T10:00:00Z")
}
```

### `primarycontacts`
```javascript
{
  _id: ObjectId,
  contactName: "John Smith",      // Required
  contactPhoneNo: "+919876543210",// Required
  contactEmail: "john@email.com", // Optional
  bookingType: "Direct (B2C)",    // "Agent (B2B)" | "Direct (B2C)"
  requirements: "Need 2 tickets...", // Long text, may contain flight itinerary
  interested: "Yes",              // "Yes" | "No"
  createdAt: ISODate,
  updatedAt: ISODate
}
// Indexes: contactName, contactPhoneNo
```

### `bookings`
```javascript
{
  _id: ObjectId,
  primaryContactId: ObjectId,     // → primarycontacts._id (Required)
  uniqueCode: "TW0042",          // Auto-generated, unique
  destination: "Dubai",           // May be AI-extracted
  travelDate: ISODate,            // May be AI-extracted
  returnDate: ISODate,            // For round trips
  flightFrom: "Delhi",
  flightTo: "Dubai",
  tripType: "one-way",            // "one-way" | "round-trip" | "multi-city"
  segments: [                     // For multi-city trips
    { from: "Delhi", to: "Dubai", date: ISODate },
    { from: "Dubai", to: "Singapore", date: ISODate }
  ],
  amount: 50000,                  // Quoted amount
  totalAmount: 55000,             // Grand total
  finalQuotation: "Q-2026-042",   // Quotation reference string
  travellers: 2,                  // AI-extracted or manual
  status: "Pending",              // "Pending" → "Working" → "Sent" → "Booked"
  createdByUserId: ObjectId,      // → users._id (Required)
  assignedToUserId: ObjectId,     // → users._id (Nullable)
  createdAt: ISODate,
  updatedAt: ISODate
}
// Indexes: createdAt, status, assignedToUserId, createdByUserId, primaryContactId
```

### `passengers`
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,            // → bookings._id (Required)
  name: "John Smith",             // Required
  phoneNumber: "+919876543210",
  email: "john@email.com",
  dob: "1990-05-15",
  anniversary: "2020-06-20",
  country: "UAE",
  flightFrom: "Delhi",
  flightTo: "Dubai",
  departureTime: "10:00",
  arrivalTime: "14:00",
  tripType: "round-trip",
  returnDate: "2026-03-25",
  returnDepartureTime: "16:00",
  returnArrivalTime: "20:00",
  createdAt: ISODate,
  updatedAt: ISODate
}
// Index: bookingId
```

### `payments`
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,            // → bookings._id (Required)
  amount: 25000,                  // Required
  paymentMethod: "UPI",           // Required (free-text)
  transactionId: "TXN123456",
  remarks: "First installment",
  date: ISODate,                  // Required, defaults to now
  createdAt: ISODate,
  updatedAt: ISODate
}
// Indexes: bookingId, date
```

### `comments`
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,            // → bookings._id (Required)
  createdById: ObjectId,          // → users._id (Required)
  text: "Customer confirmed dates", // Required
  createdAt: ISODate
}
// Indexes: bookingId, createdById
```

### `activities`
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,            // → bookings._id (Required)
  userId: ObjectId,               // → users._id (Required)
  action: "STATUS_CHANGE",        // Action type string
  details: "Pending → Working",   // Human-readable description
  createdAt: ISODate
}
// Index: { bookingId: 1, createdAt: -1 }
```

### `notifications`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,               // → users._id (recipient, Required)
  bookingId: ObjectId,            // → bookings._id (optional)
  message: "Booking assigned to you", // Required
  read: false,                    // Boolean
  createdAt: ISODate,
  updatedAt: ISODate
}
// Indexes: { userId, read }, { userId, createdAt }, bookingId
```

### `counters`
```javascript
{
  _id: "bookingId",               // Sequence name (Required)
  seq: 42                         // Current counter value
}
```
Used by Booking's `pre('save')` hook to generate sequential `uniqueCode` values.

---

## Important Notes

### No Foreign Key Constraints
MongoDB doesn't enforce FK relationships. The app code handles referential integrity:
- When deleting a booking, the controller deletes all related comments, passengers, payments, notifications, and the primary contact.
- Orphaned records won't cause errors but will waste space.

### Virtual Properties
The Booking model has virtual properties that are populated on-the-fly (not stored in DB):
```javascript
booking.assignedToUser    // populated from users collection
booking.createdByUser     // populated from users collection
booking.primaryContact    // populated from primarycontacts collection
booking.comments          // populated from comments collection
booking.payments          // populated from payments collection
booking.passengers        // populated from passengers collection
```

### Data Transformation Note
The backend performs data mapping before sending to frontend:
- `primaryContact.contactName` → `contactPerson`
- `primaryContact.contactPhoneNo` → `contactNumber`
- `primaryContact.bookingType` "Agent (B2B)" → `"B2B"`, "Direct (B2C)" → `"B2C"`
- `booking.destination` → also exposed as `destinationCity`
- `booking.passengers` → also exposed as `travelers`

This mapping happens in controllers (not in the model), so if you read directly from the DB, field names will differ from API responses.
