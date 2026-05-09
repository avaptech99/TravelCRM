# CRM 3.0 Database Schema Reference

This document outlines all major collections (tables) and their respective columns (fields) in the CRM 3.0 system.

---

## 1. Bookings (`bookings`)
The core record representing a sales lead or confirmed booking.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique internal identifier |
| `uniqueCode` | String | Sequential ID (e.g., TW0638) |
| `primaryContactId` | ObjectId | Reference to `PrimaryContact` |
| `contact.name` | String | Snapshot: Primary contact name |
| `contact.phone` | String | Snapshot: Primary contact phone |
| `contact.email` | String | Snapshot: Primary contact email |
| `contact.type` | String | "B2B" or "B2C" |
| `contact.requirements`| String | Raw lead requirements |
| `contact.interested` | Boolean | Lead interest flag |
| `destination` | String | Target destination country |
| `travelDate` | Date | Scheduled departure date |
| `returnDate` | Date | Scheduled return date |
| `flightFrom` | String | Departure airport code |
| `flightTo` | String | Arrival airport code |
| `tripType` | Enum | 'one-way', 'round-trip', 'multi-city' |
| `segments` | Array | List of flight legs (from, to, date) |
| `amount` | Number | Quoted selling price |
| `totalAmount` | Number | Total confirmed amount |
| `finalQuotation` | String | Quotation suffix (e.g., TW0638-B) |
| `status` | Enum | 'Pending', 'Working', 'Sent', 'Booked', 'Follow Up' |
| `followUpDate` | Date | Next scheduled follow-up |
| `includesFlight` | Boolean | Whether flights are part of the deal |
| `includesAdditionalServices` | Boolean | Whether hotel/visa are included |
| `additionalServicesDetails` | String | Text details of hotel/visa services |
| `pricePerTicket` | Number | Cost breakdown per person |
| `outstanding` | Number | Remaining balance (Total - Paid) |
| `createdByUserId` | ObjectId | Reference to `User` who created the lead |
| `assignedToUserId` | ObjectId | Reference to `User` currently working on it |
| `assignedGroup` | String | Sales group (e.g., "Package / LCC") |
| `company` | String | Travel agency name (for B2B) |
| `isVerified` | Boolean | Manager verification status |
| `verifiedBy` | String | Name of manager who verified |
| `verifiedAt` | Date | Timestamp of verification |
| `estimatedCosts` | Array | List of expected costs (type, price, source) |
| `actualCosts` | Array | List of finalized costs (type, price, source) |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last modification timestamp |

---

## 2. Passengers (`passengers`)
Individual traveler details associated with a booking.

| Field | Type | Description |
| :--- | :--- | :--- |
| `bookingId` | ObjectId | Reference to the parent `Booking` |
| `name` | String | Full name of the passenger |
| `phoneNumber` | String | Contact number with country code |
| `email` | String | Email address |
| `dob` | String | Date of birth |
| `anniversary` | String | Marriage anniversary |
| `country` | String | Country of residence |
| `flightFrom` | String | Individual departure point |
| `flightTo` | String | Individual destination |
| `departureTime` | String | Departure date/time |
| `tripType` | String | Trip type |
| `returnDate` | String | Return date |

---

## 3. Payments (`payments`)
Financial transactions recorded against a booking.

| Field | Type | Description |
| :--- | :--- | :--- |
| `bookingId` | ObjectId | Reference to parent `Booking` |
| `amount` | Number | Amount paid in this transaction |
| `paymentMethod` | String | Method (Bank, Cash, CC, etc.) |
| `transactionId` | String | Reference/UTR number |
| `remarks` | String | Internal notes for this payment |
| `date` | Date | Date transaction was recorded |

---

## 4. Timeline / Activities (`activities`)
Audit log of all system actions and manual notes.

| Field | Type | Description |
| :--- | :--- | :--- |
| `bookingId` | ObjectId | Reference to parent `Booking` |
| `userId` | ObjectId | Reference to `User` who performed action |
| `type` | Enum | 'comment' or 'activity' |
| `text` | String | Content for manual comments |
| `action` | String | Action type (e.g., "ASSIGNED", "STATUS_CHANGE") |
| `details` | String | Machine-readable details or extended log |
| `expireAt` | Date | TTL index for automatic cleanup |

---

## 5. Users (`users`)
System agents and administrators.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Display name |
| `email` | String | Login email |
| `role` | String | Permission level (AGENT, ADMIN, etc.) |
| `groups` | Array | Sales groups assigned to the user |
| `permissions` | Object | Granular flags (canEditActualCost, etc.) |
| `isOnline` | Boolean | Real-time presence status |

---

## 6. Secondary Models
- **Counters**: Used for sequential `uniqueCode` generation.
- **Settings**: Stores dropdown options (destinations, flight sources, etc.).
- **PrimaryContact**: Legacy storage for contact details (now snapshotted inside Booking).
