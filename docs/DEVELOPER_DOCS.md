# Developer Documentation

This document provides a technical overview of the Travel CRM system for engineers working on the codebase.

## 🧠 AI Travel Information Extraction

When a booking is created or its "Requirements" field is updated, the system runs an extraction utility located at `travel-crm-backend/src/utils/extractTravelInfo.ts`.

### Logic & Libraries
- **`chrono-node`**: Used to parse natural language dates (e.g., "next Friday", "12 May").
- **`compromise`**: Used to identify locations and nouns.
- **Heuristics**: We use custom regex and noun-pattern matching (e.g., "trip to [Place]") to improve detection for common travel phrases that standard NLP libraries might miss.

### Implementation
Integrated into:
- `bookingController.ts` -> `createBooking`
- `bookingController.ts` -> `updateBooking`

## 📊 Smart Data Display (Hierarchy)

The dashboard table uses a hierarchical logic to ensure users see the "most accurate" data available.

**Priority Order:**
1. **Explicit Flight Details**: Data entered manually in the "Finalize Booking" view (stored in the first traveler's object).
2. **Extracted Data**: Data automatically parsed from the "Requirements" field (stored in `destinationCity` and `travelDate` fields of the Booking model).
3. **Placeholder**: A simple "-" if no data is available.

**Frontend Mapping:**
Located in `BookingsTable.tsx`:
```tsx
const flightDestination = row.travelers?.[0]?.country;
return flightDestination || row.destinationCity || '-';
```

## 🔄 Automatic Workflow Logic

### Auto-Reflection
In the **Finalize Booking** view (`BookingTravelers.tsx`), if the primary flight details are empty, the form automatically pre-fills "Destination" and "Departure Date" using the AI-extracted fields.

### Status Promotion
When "Save Changes" is clicked in the Finalize view, the system checks:
- If `totalPaid > 0` (recorded payments exist).
- If true, it automatically patches the status to `Booked`.

## 🗄 Database Model (Mongoose)

The `Booking` model is the central entity. Key fields added recently:
- `destinationCity`: String (extracted)
- `travelDate`: Date (extracted)
- `travellers`: Number (extracted)
- `travelers`: Array of objects (manual entries)

## 🎨 UI Guidelines
- **Theme**: Light/Dark flexible with a focus on vibrant gradients (`brand-gradient`).
- **Icons**: Lucide-React.
- **Notifications**: Sonner for toasts.
