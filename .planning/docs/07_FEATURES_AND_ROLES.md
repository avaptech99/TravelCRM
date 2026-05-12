# ✨ Features & Role-Based Access

> Complete feature list with who can do what.

---

## Feature Matrix

### ✅ = Full Access, ⚡ = Limited Access, ❌ = No Access

| Feature | ADMIN | AGENT | VISA / TICKETING | MARKETER | ACCOUNT / OPS |
|---|:---:|:---:|:---:|:---:|:---:|
| **Dashboard Overview** | ✅ All | ✅ Grouped | ✅ Grouped | ✅ Created | ✅ Booked only |
| **Department Badges** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Profitability/Margins** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Cost Verification** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **View All Bookings** | ✅ | ⚡ Group only | ⚡ Group only | ❌ | ⚡ Booked only |
| **Bulk Assign** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Dropdowns** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SSE Real-time Sync** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Detailed Feature Descriptions

### 1. 🔐 Authentication & Enhanced Auth
- JWT-based authentication (30-day persistence).
- **Role-Based Access Control (RBAC)**: Expanded roles including `VISA`, `TICKETING`, `OPERATION`, and `ACCOUNT`.
- **Group-Based Visibility**: Users assigned to specific "Groups" (e.g., Package / LCC) can see all leads in that bucket before individual assignment.

### 2. 📊 Dashboard & SSE Real-time
- **SSE (Server-Sent Events)**: Replaced standard polling with a persistent event stream at `/api/stream`.
- **Live Events**: UI updates instantly on `booking_created`, `booking_assigned`, and `booking_deleted`.
- **Analytics Sync**: Dashboard stats are invalidated via `analytics_stale` events when payments are added or deleted.

### 3. 🏢 Department & Group Management
- **Assigned Group**: Every booking is routed to a department (Package / LCC, Visa, Ticketing, etc.).
- **Badges**: Visual indicators on the dashboard show which department is handling the lead.
- **Auto-Routing**: Leads can be assigned to a group first, then claimed by an agent.

### 4. 💰 Financials & Profitability (NEW)
- **Cost Breakdown**: Track `estimatedCosts` vs `actualCosts` across multiple types (Flight, Hotel, Visa, etc.) and sources.
- **Margin Calculation**: Automatic calculation of `estimatedMargin` and `actualMargin`.
- **Outstanding Tracking**: Real-time balance calculation (`totalAmount` - `totalPaid`).
- **Smart Fallback**: If `totalAmount` is missing, the system sums the cost breakdown to suggest a selling price.

### 5. 🛡️ Verification System
- **Admin Verification**: Bookings can be marked as `isVerified` by an Admin once financials are audited.
- **Audit Trail**: Tracks `verifiedBy` and `verifiedAt`.

### 6. ⚙️ Admin Dropdown Management
- **Dynamic Config**: Admins can manage global dropdown options (Companies, Cost Types, Cost Sources, Groups) directly from the **Settings** page.
- **Global Sync**: Changes propagate to all user forms instantly.

### 7. 🤖 AI-Powered Extraction (V2)
- Enhanced extraction of segments, PAX counts, and dates from raw requirements text.
- Decoupled from `PrimaryContact` via **Embedded Contact Snapshots** in the Booking model.

### 8. 📱 UI/UX Modernization
- **Mobile Navigation**: Bottom Tab Bar for mobile users; Persistent Sidebar for desktop.
- **Success/Error Feedback**: Consistent toast notifications via `sonner`.
- **Cursor Pagination**: Optimized list loading for large datasets (Atlas M0 friendly).

### 9. 🚀 Performance Architecture
- **Parallelized Data Fetching**: `getBookingById` fetches comments, payments, and passengers in parallel.
- **Background Side-Effects**: Responds to user immediately while handling logging, notifications, and legacy sync via `setImmediate`.
- **Request Deduplication**: Prevents multiple simultaneous fetches of the same booking ID from hitting the database twice.

