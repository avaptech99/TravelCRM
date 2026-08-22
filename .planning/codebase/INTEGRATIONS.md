# Integrations

## External Systems

### WordPress / Website Leads
- **Description**: Receives leads from WordPress forms (Ninja Forms).
- **Endpoint**: `POST /api/external/lead`
- **Authentication**: API Key (`x-api-key` header).
- **Implementation**: `externalController.ts` parses `raw_fields` from WordPress and maps them to the internal `Booking` and `PrimaryContact` models.

### MongoDB
- **Description**: Primary data store.
- **Connection**: Managed via Mongoose in `config/db.ts`.
- **Patterns**: Schema-based models for Bookings, Users, Notifications, Settings, etc.

## Internal Integrations

### Admin-Managed Metadata Dropdowns
- **Description**: Central settings dashboard that dynamically configures dropdown options used across the application.
- **Dynamic Entities**: Companies, Cost Types, Cost Sources, and Groups.
- **Endpoints**: `GET /api/settings/dropdowns`, `PUT /api/settings/dropdowns/:key`.
- **UI Components**: Integrating dynamically in `NewBookingModal`, `EditModal`, and `/settings`.

### Server-Sent Events (SSE)
- **Description**: Real-time event streaming for dashboard updates and notifications.
- **Endpoint**: `/api/stream`
- **Implementation**: `sseManager.ts` handles connections, heartbeats, and message broadcasting.

### Socket.io
- **Description**: Present in the codebase as a stub (`socket.ts`) for future real-time upgrades.
- **Status**: Not currently the primary real-time mechanism (SSE is used).

### Cron / Background Tasks
- **Description**: Hourly background job for follow-up reminders.
- **Implementation**: `followUpCron.ts` checks for due follow-ups and triggers SSE notifications.

## Future / Potential Integrations
- **Email/SMS**: No direct integration found, though notification models exist.
- **Flight APIs**: The system stores flight segments but does not appear to fetch real-time flight data yet.
