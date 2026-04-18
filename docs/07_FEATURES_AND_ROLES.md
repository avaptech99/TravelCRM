# ✨ Features & Role-Based Access

> Complete feature list with who can do what.

---

## Feature Matrix

### ✅ = Full Access, ⚡ = Limited Access, ❌ = No Access

| Feature | ADMIN | AGENT | MARKETER |
|---|:---:|:---:|:---:|
| **Dashboard Overview** | ✅ All bookings | ✅ Assigned bookings | ✅ Created leads |
| **View All Bookings** | ✅ | ✅ | ❌ |
| **View My Bookings/Leads** | ✅ | ✅ (assigned + created) | ✅ (created only) |
| **Create New Booking** | ✅ | ✅ (auto-assigns to self) | ✅ |
| **Edit Booking Details** | ✅ | ⚡ (assigned only) | ⚡ (requirements only, before assignment) |
| **Delete Booking** | ✅ | ❌ | ❌ |
| **Change Booking Status** | ✅ | ⚡ (assigned only) | ❌ |
| **Assign Agent** | ✅ | ✅ | ❌ |
| **Bulk Assign** | ✅ | ❌ | ❌ |
| **Add/Edit Passengers** | ✅ | ⚡ (assigned only) | ❌ |
| **Add/Delete Payments** | ✅ | ⚡ (assigned only) | ❌ |
| **Add Comments/Remarks** | ✅ | ⚡ (assigned only) | ✅ |
| **View Comments** | ✅ | ✅ | ✅ (own bookings) |
| **View Activity Log** | ✅ | ✅ | ✅ (own bookings) |
| **Travel Calendar** | ✅ (all bookings) | ✅ (assigned only) | ❌ |
| **Booked/EDT View** | ✅ | ✅ | ❌ |
| **Reports & Analytics** | ✅ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ |
| **Change Own Password** | ✅ | ✅ | ✅ |
| **Edit Own Profile** | ✅ | ✅ | ✅ |
| **Receive Notifications** | ✅ | ✅ (assignment, marketer comments) | ✅ (status changes, assignment) |
| **Unassign Agent Bookings** | ✅ | ❌ | ❌ |

---

## Detailed Feature Descriptions

### 1. 🔐 Authentication & Login
- JWT-based authentication (token valid for 30 days)
- Auto-seed admin account if database is empty
- Password hashing with bcrypt (8 rounds)
- Auto-upgrade from higher bcrypt rounds on login
- Online/offline status tracking

### 2. 📊 Dashboard
- **Stats Cards**: Total, Pending, Working, Sent, Booked counts
- **Recent Bookings**: Latest 5 bookings table
- **Notifications**: Bell icon with unread count
- Powered by consolidated `/api/sync` endpoint (one API call for everything)
- Polls every 20 seconds for near-real-time updates
- Role-scoped: Each role sees only their relevant data

### 3. ✈️ Booking Management
- **Create**: Form with contact info, booking type (B2B/B2C), requirements, flight details
- **View**: Full detail page with all related data
- **Edit**: Update requirements, flight info, amounts, interest status
- **Delete**: ADMIN only — cascading delete of all related records
- **Status Workflow**: `Pending` → `Working` → `Sent` → `Booked`

### 4. 🤖 AI-Powered Data Extraction
When a booking is created with "Requirements" text, the system automatically:
- **Extracts destinations** using `compromise` NLP library
- **Extracts dates** using `chrono-node` date parser
- **Extracts traveler counts** using regex patterns (e.g., "2 pax", "three adults")
- Results cached for 1 hour to save CPU

### 5. 👥 Passenger/Traveler Management (Finalize Booking)
- Add multiple passengers per booking
- Per-passenger: name, phone, email, DOB, anniversary
- Per-passenger flight details: from, to, departure/arrival times
- Round-trip support: return date, return times
- Multi-city segment support
- Auto-fill from AI-extracted data when fields are empty

### 6. 💰 Payment Tracking
- Record payments per booking
- Fields: amount, method (UPI/Cash/Bank Transfer), transaction ID, date, remarks
- Outstanding amount calculated automatically
- Payment history with delete capability

### 7. 💬 Comments/Remarks System
- Text-based comments per booking
- Shows author name and timestamp
- **Auto-comments**: Agent reassignment creates automatic comment ("Agent A ➔ Agent B")
- **Notifications**: Marketer comments notify assigned agent

### 8. 📅 Travel Calendar
- Month-view calendar showing booking travel dates
- Color-coded by status:
  - Pending = one color
  - Working = another
  - Sent = another
  - Booked = another
- Click on a date to see bookings
- Month/year navigation

### 9. 📈 Reports & Analytics (ADMIN Only)
- **Booking Distribution**: Pie chart by status
- **Revenue Trends**: Line chart by month/day
- **Payment Summary**: Total collected vs. expected, balance
- **Agent Performance**: Table showing per-agent bookings, conversions, revenue, conversion rate
- Date range filtering for all analytics

### 10. 👤 User Management (ADMIN Only)
- Create/edit/delete users
- Assign roles (ADMIN, AGENT, MARKETER)
- View online/offline status
- Reset user passwords
- **Unassign Bookings**: Bulk unassign from offline agents or specific users
- "Website Lead" system account is hidden from UI

### 11. 🔔 Notification System
Automatic notifications are created for workflows without being generic:
*Dynamic generation pulls the Lead's Contact Person strictly instead of just defaulting to "booking" or "unassigned."*
| Trigger | Recipients |
|---|---|
| Booking assigned to agent | The assigned agent |
| Lead assigned (marketer's booking) | The marketer who created it |
| Status change on marketer's lead | The marketer |
| Marketer comments on assigned booking | The assigned agent |

### 12. 🌐 WordPress Integration
- External endpoint receives form submissions from WordPress (Ninja Forms)
- Protected by API key (no JWT needed)
- Smart field parsing based on labels
- Handles multi-city repeater data
- Auto-creates PrimaryContact + Booking
- Generates formatted requirements text matching professional flight itinerary format
- Sequential booking codes (TW0001, TW0002...)

### 13. 📞 GDMS PBX Integration (Grandstream Missed Calls)
- Webhook endpoint receives CDR (Call Detail Records) from Grandstream PBX in real-time
- Protected by HTTP Basic Auth (credentials in env vars: `GDMS_WEBHOOK_USER`, `GDMS_WEBHOOK_PASS`)
- Automatically filters for missed/unanswered calls only
- **Known callers**: Adds a formatted comment to the caller's latest booking (e.g., `Miss Call from Anmoldeep , 14:15 18/4/2026`)
- **Unknown callers**: Creates a new lead with status `Pending`, created by the `Phone Lead` system user
- **Agent notification**: If the lead is assigned to an agent, that agent receives a real-time notification
- Deduplication by PBX `uniqueId` prevents double-processing
- All CDRs are stored in the `MissedCall` collection as an audit trail
- System user `Phone Lead` (`phone-lead@system.internal`) is auto-created on first webhook hit

### 14. 🔄 Global Sync (Live Updates)
- Single `/api/sync` endpoint returns all dashboard data
- Frontend polls every 20 seconds
- Replaces multiple separate API calls
- Server-side caching (30s TTL) reduces database load
- Near-real-time feel without WebSocket complexity

### 15. 🔍 Search & Filtering
Booking list supports:
- **Text search**: Contact name, phone, requirements text, flight from/to cities
- **Status filter**: Multiple statuses, plus "Interested" / "Not Interested"
- **Agent filter**: Filter by assigned agent
- **Date range**: Creation date filtering
- **Travel date filter**: Upcoming 7/10/15/30 days
- **My bookings**: Show only user's own bookings
- **Pagination**: Configurable page size

### 16. 🛡️ Security Features
- JWT token authentication on all API routes
- Role-based middleware guards (`protect`, `adminGuard`)
- Password hashing with bcrypt
- API key authentication for external endpoints
- Input validation with Zod schemas on all endpoints
- CORS configuration
- 401 auto-logout on token expiry

### 17. ⚡ Performance Optimizations
- **In-memory caching**: TTL-based cache on all read endpoints
- **Lazy loading**: All pages except Login are code-split
- **Gzip compression**: ~70% smaller API responses
- **MongoDB indexes**: On all frequently queried fields
- **Lean queries**: `.lean()` on read-only queries (skips Mongoose overhead)
- **Parallel queries**: `Promise.all` for independent database operations
- **Selective field loading**: `.select()` to fetch only needed fields
- **Self-ping**: Keeps Render free-tier server awake

### 18. 📱 Mobile Responsive Design
- Desktop: Sidebar navigation
- Mobile: Bottom tab navigation
- Responsive tables and forms
- Touch-friendly UI elements
