# CRM 2.0 Complete Field Reference

This document provides a comprehensive reference for all data fields used across the CRM 2.0 platform, including Leads, Bookings, Travelers, and Financials.

---

## 1. Core Lead & Booking Fields
These fields form the primary identity of a lead and are captured at the first entry point.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Booking ID / Unique Code** | System | Auto-generated unique identifier (e.g., `TW0042-C`). |
| **Booking Type** | Enum | `B2B` (Agent) or `B2C` (Direct customer). |
| **Contact Person** | String | The full name of the primary lead or customer. |
| **Country Code** | Select | International dialing code (e.g., `+91`). |
| **Contact Number** | String | 10-digit mobile number. Combined with country code in the database. |
| **Contact Email** | String | Email address for quotes and itineraries. |
| **Requirements** | Text | Multi-line field capturing the customer's specific travel needs. |
| **Status** | Enum | `Pending`, `Working`, `Sent`, `Booked`, `Follow up`. |
| **Assigned To Agent** | User Ref | The specific agent/user assigned to handle the lead. |
| **Assigned Group** | Dropdown | The functional group handling the lead (e.g., `LCC`, `Packages`). |
| **Interested** | Toggle | Quick tracking of lead sentiment (`Yes` / `No`). |
| **Created At** | Timestamp | Date and time the lead was first recorded. |

---

## 2. Advanced Traveler & Identity Details
Captured during the "Update Travelers" phase or when finalizing a booking.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Traveler Name** | String | Legal name as it appears on the passport. |
| **Traveler Email/Phone** | String | Direct contact details for individual passengers. |
| **Date of Birth (DOB)** | Date | Required for flight ticketing and visa processing. |
| **Anniversary** | Date | Captured for personalized marketing and greetings. |
| **Passport Info** | String | (Optional) Passport number and expiry details. |

---

## 3. Flight & Itinerary Details
Used to generate the "Ticket-Style" itinerary cards in the UI.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Trip Type** | Enum | `one-way`, `round-trip`, or `multi-city`. |
| **Flight From (Origin)** | String | IATA code or City name of departure. |
| **Flight To (Destination)** | String | IATA code or City name of arrival. |
| **Departure Time** | DateTime | Date and time of the outbound flight. |
| **Arrival Time** | DateTime | Date and time of arrival at the destination. |
| **Return Date** | Date | Departure date for the return leg (Round-Trip only). |
| **Return Departure** | DateTime | Specific time for return leg departure. |
| **Return Arrival** | DateTime | Specific time for return leg arrival. |
| **Segments** | List | A list of flight legs (From, To, Date) for **Multi-City** itineraries. |
| **Includes Flight** | Toggle | Determines if flight cards should be visible in the UI. |

---

## 4. Financial & Payment Tracking
Comprehensive tracking for accounting and margin analysis.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Total Amount** | Number | The final lump-sum price quoted to the customer. |
| **Final Quotation No.** | Suffix | Suffixes `A` through `G` appended to the Booking ID for versioning. |
| **Company Name** | Dropdown | The business entity under which the booking is processed. |
| **Payment Amount** | Number | Individual payment transaction amount. |
| **Payment Method** | Select | `Bank Transfer`, `Cash`, `Credit Card`, `UPI`, etc. |
| **Transaction ID** | String | Reference number from the bank or payment gateway. |
| **Payment Date** | Date | The date the funds were received. |
| **Estimated Costs** | List | Breakdown of expected expenses (Type, Price, Source/Supplier). |
| **Actual Costs** | List | Final audited expenses incurred for the booking. |
| **Estimated Margin** | Formula | `Total Amount` - `Total Estimated Costs`. |
| **Net Margin** | Formula | `Total Amount` - `Total Actual Costs`. |
| **Outstanding** | Formula | `Total Amount` - `Total Paid`. |

---

## 5. Verification & Security
Final audit controls for administrators.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Verified** | Boolean | Lock indicating the booking has passed financial audit. |
| **Verified By** | User Ref | The Admin or Auditor who verified the booking. |
| **Additional Services** | Toggle | Activates the capture of non-flight service details. |
| **Service Details** | Text | Structured mapping of extra services (Visa, Insurance, Ground, etc.). |

---

## 6. Activity & Communication
*   **Comments**: A chronological activity feed tracking status changes, assignment history, and manual agent remarks.
*   **Notifications**: Automated alerts for status changes, reassignment, or verification tasks.
