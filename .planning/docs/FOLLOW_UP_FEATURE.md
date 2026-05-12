# Status Follow-Up Feature Documentation

This document provides a technical overview of the "Status Follow Up" feature in the CRM project, including its architecture, files touched, and the complete life cycle.

## Overview
The Follow-Up system is designed to ensure that leads and bookings requiring future action are tracked and that agents are alerted when action is due.

---

## 1. Files Touched

### Backend (Logic & Data)
- **Models**:
    - [Booking.ts](file:///c:/Users/anmol/OneDrive/Desktop/CRM/travel-crm-backend/src/models/Booking.ts): Defines the `status` enum (includes `'Follow Up'`) and the `followUpDate` field.
    - [Activity.ts](file:///c:/Users/anmol/OneDrive/Desktop/CRM/travel-crm-backend/src/models/Activity.ts): Stores history of status changes and automated reminders.
    - [Notification.ts](file:///c:/Users/anmol/OneDrive/Desktop/CRM/travel-crm-backend/src/models/Notification.ts): Stores alerts generated for agents.
- **Controllers**:
    - [bookingController.ts](file:///c:/Users/anmol/OneDrive/Desktop/CRM/travel-crm-backend/src/controllers/bookingController.ts): Logic for manual status updates and setting follow-up dates.
- **Services/Utils**:
    - [followUpCron.ts](file:///c:/Users/anmol/OneDrive/Desktop/CRM/travel-crm-backend/src/utils/followUpCron.ts): Background service that monitors due dates and sends notifications.
    - [activityLogger.ts](file:///c:/Users/anmol/OneDrive/Desktop/CRM/travel-crm-backend/src/utils/activityLogger.ts): Utility to record all follow-up events in the audit trail.

### Frontend (User Interface)
- **Pages**:
    - [BookingDetails.tsx](file:///c:/Users/anmol/OneDrive/Desktop/CRM/frontend/src/pages/BookingDetails.tsx): Interface for changing status and setting follow-up dates.
    - [Bookings.tsx](file:///c:/Users/anmol/OneDrive/Desktop/CRM/frontend/src/pages/Bookings.tsx): Filtering and viewing bookings by follow-up status.
- **Components**:
    - [EditModal.tsx](file:///c:/Users/anmol/OneDrive/Desktop/CRM/frontend/src/features/bookings/components/EditModal.tsx): Modal for modifying booking details and follow-up calendar.
    - [BookingsTable.tsx](file:///c:/Users/anmol/OneDrive/Desktop/CRM/frontend/src/features/bookings/components/BookingsTable.tsx): Displays the "Follow Up" status badge in lists.

---

## 2. Feature Life Cycle

The lifecycle of a follow-up consists of five main stages:

### Phase 1: Initiation
An agent or admin determines that a lead needs further contact. In the **Booking Details** or **Edit Modal**, they:
1. Change the booking status to **"Follow Up"**.
2. Select a specific **Follow-up Date**.

### Phase 2: Persistence & Logging
The frontend sends an update request to the backend. The system:
- Updates the `Booking` record in MongoDB.
- Uses the `activityLogger` to create an entry in the activity feed (e.g., *"Status updated to Follow Up; Date set to 2026-05-10"*).

### Phase 3: Background Monitoring
The `followUpCron` service runs automatically every hour. It scans the database for:
- Bookings with `status: "Follow Up"`.
- Bookings where `followUpDate` is less than or equal to the current time (`now`).

### Phase 4: Alerting
When a follow-up becomes due:
1. **Notification**: A system notification is created for the assigned agent (or creator if unassigned).
2. **Activity Feed**: An automated activity entry is logged (e.g., *"Automatic reminder sent for booking TW0001"*).
3. **UI Feedback**: The agent sees the notification in their dashboard/notification center.

### Phase 5: Resolution
The agent performs the necessary follow-up action (e.g., a phone call or email). Once completed, they:
- Update the booking to a new status (e.g., **"Working"**, **"Sent"**, or **"Booked"**).
- This transition removes the booking from the active follow-up queue.
