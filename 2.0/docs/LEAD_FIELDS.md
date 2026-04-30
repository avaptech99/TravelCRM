# CRM 2.0 Lead Lifecycle & Field Location Guide

This guide maps every field in the CRM 2.0 project to its specific location and the order in which it is typically captured.

---

## Stage 1: |New Booking| (First Entry Point)
*Location: Dashboard > "New Booking" Button / WordPress Integration*

Captured when a prospect first enters the system.

1.  **Booking Type**: Radio button selecting **Agent (B2B)** or **Direct (B2C)**.
2.  **Contact Person**: Full legal name of the primary lead or customer.
3.  **Country Code**: Dropdown for international dialing codes (Default: `+91`).
4.  **Contact Number**: 10-digit mobile number (validated).
5.  **Requirements**: Multi-line text field for capturing specific customer needs or travel requests (Compulsory).
6.  **Assigned Group**: Dropdown to categorize the lead (e.g., `LCC`, `Package`, `Visa`).
7.  **Status**: (System Field) Automatically set to **Pending**.

---

## Stage 2: |Edit Icon in Leads Table| (Quick Management)
*Location: Bookings Table > Edit Icon (Pencil)*

Used for daily updates and moving the lead through the pipeline.

1.  **Status**: Dropdown to update lead stage.
    *   Values: `Pending`, `Working`, `Sent`, `Booked`, `Follow up`.
2.  **Interested**: Toggle switch for customer sentiment (**Yes** / **No**).
3.  **Assigned Group**: Dropdown to change the functional team.
4.  **Assign to Agent**: Dropdown to assign a specific agent (visible only if group is selected).
5.  **Add Remark / Comment**: Multi-line field to add a new activity log entry.

---

## Stage 3: |Update Travelers| / |Finalize Booking| (Operational Depth)
*Location: Booking Details > "Update Travelers" Button*

The comprehensive form for ticketing, financials, and logistics.

### A. Core Details
1.  **Final Quotation No.**: Dropdown to select the quote version (e.g., `booking-id-A` to `booking-id-G`).
2.  **Company Name**: Dropdown to select the processing business entity (Managed by Admin).

### B. Service Toggles
1.  **Includes Flight**: Toggle to enable/disable the Flight Details section.
2.  **Includes Additional Services**: Toggle to enable/disable the non-flight services section.

### C. Travel & Itinerary Details
1.  **Trip Type**: `One-way`, `Round-trip`, or `Multi-city`.
2.  **Flight From / To**: Origin and destination city/airport names.
3.  **Departure / Arrival**: Specific dates and times for outbound travel.
4.  **Return Details**: Return Departure/Arrival times (Required for **Round-Trip**).
5.  **Multi-City Segments**: Leg-by-leg tracking (From/To/Date) for complex itineraries.

### D. Traveler Identity (Per Passenger)
1.  **Full Name**: Legal name for ticketing.
2.  **Contact Details**: Individual Email and Phone (with Country Code).
3.  **Date of Birth (DOB)**: Required for flight and visa processing.
4.  **Anniversary**: Optional field for marketing/greetings.

### E. Additional Services (Service Configuration)
1.  **Service Selection Bubbles**: Interactive buttons to quickly select service types:
    *   `Air Ticket`, `Visa`, `Insurance`, `Ground Handling`, `Hotel`, `Sightseeing`.
2.  **Service Details Text Area**: A multi-line field where specific details for each selected service are recorded. Selecting a "bubble" adds a prefix (e.g., `Visa-`) to this area.

### F. Financials & Costs
1.  **Lump Sum Amount**: The final total price quoted to the customer.
2.  **Manage Cost Button**: A primary action button used to toggle the cost-entry section.
3.  **Cost Type Selection Bubbles**: Buttons to instantiate specific cost rows (e.g., `Air Ticket`, `Hotel`, `Visa`).
4.  **Cost Rows**:
    *   **Cost Type**: The category of the expense (Auto-populated from bubbles).
    *   **Price**: The specific cost incurred for that item.
    *   **Source**: Dropdown to select the Supplier/Provider for that cost.
5.  **Auto-calculate Margin Button**: Triggers the calculation of profit based on the Lump Sum and Cost Rows.
6.  **Estimated Margin Display**: A visual box showing the real-time profit/margin for the booking.

### G. Payment Recording
1.  **Payment Amount**: The specific amount received in the current transaction.
2.  **Payment Method**: `Bank Transfer`, `Cash`, `UPI`, `Credit Card`, etc.
3.  **Transaction ID**: Reference number for verification.
4.  **Payment Date**: Date funds were received.
5.  **Payment Remarks**: Transaction-specific notes.
