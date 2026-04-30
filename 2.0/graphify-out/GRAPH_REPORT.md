# Graph Report - .  (2026-04-28)

## Corpus Check
- 104 files · ~202,991 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 163 nodes · 84 edges · 82 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Caching & Utilities|Caching & Utilities]]
- [[_COMMUNITY_Authentication Context|Authentication Context]]
- [[_COMMUNITY_Database Initialization|Database Initialization]]
- [[_COMMUNITY_Frontend App Core|Frontend App Core]]
- [[_COMMUNITY_Booking Feature Components|Booking Feature Components]]
- [[_COMMUNITY_Core Module 5|Core Module 5]]
- [[_COMMUNITY_Core Module 6|Core Module 6]]
- [[_COMMUNITY_Core Module 7|Core Module 7]]
- [[_COMMUNITY_Frontend Components 8|Frontend Components 8]]
- [[_COMMUNITY_Module 9|Module 9]]
- [[_COMMUNITY_Module 10|Module 10]]
- [[_COMMUNITY_Module 11|Module 11]]
- [[_COMMUNITY_Module 12|Module 12]]
- [[_COMMUNITY_Module 13|Module 13]]
- [[_COMMUNITY_Module 14|Module 14]]
- [[_COMMUNITY_Module 15|Module 15]]
- [[_COMMUNITY_Module 16|Module 16]]
- [[_COMMUNITY_Module 17|Module 17]]
- [[_COMMUNITY_Frontend Components 18|Frontend Components 18]]
- [[_COMMUNITY_Frontend Components 19|Frontend Components 19]]
- [[_COMMUNITY_Frontend Components 20|Frontend Components 20]]
- [[_COMMUNITY_Frontend Components 21|Frontend Components 21]]
- [[_COMMUNITY_Frontend Components 22|Frontend Components 22]]
- [[_COMMUNITY_Frontend Components 23|Frontend Components 23]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 25|Module 25]]
- [[_COMMUNITY_Module 26|Module 26]]
- [[_COMMUNITY_Module 27|Module 27]]
- [[_COMMUNITY_Module 28|Module 28]]
- [[_COMMUNITY_Module 29|Module 29]]
- [[_COMMUNITY_Module 30|Module 30]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Backend Controllers 33|Backend Controllers 33]]
- [[_COMMUNITY_Module 34|Module 34]]
- [[_COMMUNITY_Module 35|Module 35]]
- [[_COMMUNITY_Module 36|Module 36]]
- [[_COMMUNITY_Module 37|Module 37]]
- [[_COMMUNITY_Module 38|Module 38]]
- [[_COMMUNITY_Module 39|Module 39]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 41|Module 41]]
- [[_COMMUNITY_Module 42|Module 42]]
- [[_COMMUNITY_Module 43|Module 43]]
- [[_COMMUNITY_Frontend Components 44|Frontend Components 44]]
- [[_COMMUNITY_Frontend Components 45|Frontend Components 45]]
- [[_COMMUNITY_Frontend Components 46|Frontend Components 46]]
- [[_COMMUNITY_Frontend Components 47|Frontend Components 47]]
- [[_COMMUNITY_Frontend Components 48|Frontend Components 48]]
- [[_COMMUNITY_Frontend Components 49|Frontend Components 49]]
- [[_COMMUNITY_Frontend Components 50|Frontend Components 50]]
- [[_COMMUNITY_Frontend Components 51|Frontend Components 51]]
- [[_COMMUNITY_Frontend Components 52|Frontend Components 52]]
- [[_COMMUNITY_Module 53|Module 53]]
- [[_COMMUNITY_Module 54|Module 54]]
- [[_COMMUNITY_Module 55|Module 55]]
- [[_COMMUNITY_Module 56|Module 56]]
- [[_COMMUNITY_Module 57|Module 57]]
- [[_COMMUNITY_Module 58|Module 58]]
- [[_COMMUNITY_Backend Controllers 59|Backend Controllers 59]]
- [[_COMMUNITY_Backend Controllers 60|Backend Controllers 60]]
- [[_COMMUNITY_Backend Controllers 61|Backend Controllers 61]]
- [[_COMMUNITY_Backend Controllers 62|Backend Controllers 62]]
- [[_COMMUNITY_Backend Controllers 63|Backend Controllers 63]]
- [[_COMMUNITY_Database Models 64|Database Models 64]]
- [[_COMMUNITY_Database Models 65|Database Models 65]]
- [[_COMMUNITY_Database Models 66|Database Models 66]]
- [[_COMMUNITY_Database Models 67|Database Models 67]]
- [[_COMMUNITY_Database Models 68|Database Models 68]]
- [[_COMMUNITY_Database Models 69|Database Models 69]]
- [[_COMMUNITY_Database Models 70|Database Models 70]]
- [[_COMMUNITY_Database Models 71|Database Models 71]]
- [[_COMMUNITY_Database Models 72|Database Models 72]]
- [[_COMMUNITY_Database Models 73|Database Models 73]]
- [[_COMMUNITY_API Routes 74|API Routes 74]]
- [[_COMMUNITY_API Routes 75|API Routes 75]]
- [[_COMMUNITY_API Routes 76|API Routes 76]]
- [[_COMMUNITY_API Routes 77|API Routes 77]]
- [[_COMMUNITY_API Routes 78|API Routes 78]]
- [[_COMMUNITY_API Routes 79|API Routes 79]]
- [[_COMMUNITY_API Routes 80|API Routes 80]]
- [[_COMMUNITY_Module 81|Module 81]]

## God Nodes (most connected - your core abstractions)
1. `MemoryCache` - 6 edges
2. `useAuth()` - 3 edges
3. `touchLastSeen()` - 3 edges
4. `extractTravelInfo()` - 3 edges
5. `ProtectedRoute()` - 2 edges
6. `useGlobalSync()` - 2 edges
7. `seedDB()` - 2 edges
8. `connectDB()` - 2 edges
9. `invalidateBookingCaches()` - 2 edges
10. `Booking Model` - 2 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  TravelCRM-CRM-2.0\frontend\src\components\ProtectedRoute.tsx → TravelCRM-CRM-2.0\frontend\src\context\AuthContext.tsx
- `useGlobalSync()` --calls--> `useAuth()`  [INFERRED]
  TravelCRM-CRM-2.0\frontend\src\hooks\useGlobalSync.ts → TravelCRM-CRM-2.0\frontend\src\context\AuthContext.tsx
- `seedDB()` --calls--> `connectDB()`  [INFERRED]
  TravelCRM-CRM-2.0\travel-crm-backend\src\seed.ts → TravelCRM-CRM-2.0\travel-crm-backend\src\config\db.ts
- `Consolidated Sync Endpoint (/api/sync)` --conceptually_related_to--> `Travel CRM Core`  [INFERRED]
  docs/01_PROJECT_OVERVIEW.md → README.md
- `Backend (Node.js, Express, TS)` --references--> `Database (MongoDB Atlas)`  [INFERRED]
  README.md → docs/06_DATABASE_SCHEMA.md

## Communities

### Community 0 - "Caching & Utilities"
Cohesion: 0.22
Nodes (3): touchLastSeen(), MemoryCache, extractTravelInfo()

### Community 1 - "Authentication Context"
Cohesion: 0.29
Nodes (0): 

### Community 2 - "Database Initialization"
Cohesion: 0.33
Nodes (0): 

### Community 3 - "Frontend App Core"
Cohesion: 0.33
Nodes (3): useAuth(), ProtectedRoute(), useGlobalSync()

### Community 4 - "Booking Feature Components"
Cohesion: 0.4
Nodes (0): 

### Community 5 - "Core Module 5"
Cohesion: 0.4
Nodes (1): invalidateBookingCaches()

### Community 6 - "Core Module 6"
Cohesion: 0.5
Nodes (2): connectDB(), seedDB()

### Community 7 - "Core Module 7"
Cohesion: 0.5
Nodes (4): AI-Powered Extraction (chrono-node, compromise), Booking Model, PrimaryContact Model, WordPress Lead Integration

### Community 8 - "Frontend Components 8"
Cohesion: 0.67
Nodes (0): 

### Community 9 - "Module 9"
Cohesion: 0.67
Nodes (0): 

### Community 10 - "Module 10"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Module 11"
Cohesion: 0.67
Nodes (0): 

### Community 12 - "Module 12"
Cohesion: 0.67
Nodes (0): 

### Community 13 - "Module 13"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Module 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Module 15"
Cohesion: 0.67
Nodes (3): Database (MongoDB Atlas), Backend (Node.js, Express, TS), Frontend (React, Vite, Tailwind)

### Community 16 - "Module 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Module 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Frontend Components 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Frontend Components 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Frontend Components 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Frontend Components 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Frontend Components 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Frontend Components 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Module 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Module 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Module 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Module 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Module 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Module 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Module 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Module 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Module 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Backend Controllers 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Module 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Module 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Module 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Module 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Module 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Module 39"
Cohesion: 1.0
Nodes (2): Travel CRM Core, Consolidated Sync Endpoint (/api/sync)

### Community 40 - "Module 40"
Cohesion: 1.0
Nodes (2): JWT Authentication, User Roles (Admin, Agent, Marketer)

### Community 41 - "Module 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Module 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Module 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Frontend Components 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Frontend Components 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Frontend Components 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Frontend Components 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Frontend Components 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Frontend Components 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Frontend Components 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Frontend Components 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Frontend Components 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Module 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Module 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Module 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Module 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Module 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Module 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Backend Controllers 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Backend Controllers 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Backend Controllers 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Backend Controllers 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Backend Controllers 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Database Models 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Database Models 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Database Models 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Database Models 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Database Models 68"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Database Models 69"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Database Models 70"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Database Models 71"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Database Models 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Database Models 73"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "API Routes 74"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "API Routes 75"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "API Routes 76"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "API Routes 77"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "API Routes 78"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "API Routes 79"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "API Routes 80"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "Module 81"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **8 isolated node(s):** `Travel CRM Core`, `PrimaryContact Model`, `User Roles (Admin, Agent, Marketer)`, `AI-Powered Extraction (chrono-node, compromise)`, `Consolidated Sync Endpoint (/api/sync)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Module 16`** (2 nodes): `wordpress_integration_all data.php`, `travelwindow_crm_send_all_v4()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 17`** (2 nodes): `wordpress_integration_v5.php`, `travelwindow_crm_send_v5()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 18`** (2 nodes): `MainLayout()`, `MainLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 19`** (2 nodes): `if()`, `AddPaymentModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 20`** (2 nodes): `onSubmit()`, `AssignAgentModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 21`** (2 nodes): `handleMasterCheckboxClick()`, `BookingsTable.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 22`** (2 nodes): `handleSubmit()`, `CommentModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 23`** (2 nodes): `StatusUpdateModal()`, `StatusUpdateModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 24`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 25`** (2 nodes): `BookedEDT()`, `BookedEDT.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 26`** (2 nodes): `startEditingReqs()`, `BookingDetails.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 27`** (2 nodes): `onSubmit()`, `BookingTravelers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 28`** (2 nodes): `Loader()`, `Dashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 29`** (2 nodes): `handleSubmit()`, `Login.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 30`** (2 nodes): `toggleStatus()`, `MyBookings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 31`** (2 nodes): `test()`, `test-marketer-update.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 32`** (2 nodes): `test()`, `test-mongo.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Controllers 33`** (2 nodes): `getWebsiteLeadUser()`, `externalController.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 34`** (2 nodes): `backfillOutstanding()`, `backfillOutstanding.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 35`** (2 nodes): `countAll()`, `debugOutstanding.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 36`** (2 nodes): `migrate()`, `migrateData.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 37`** (2 nodes): `logActivity()`, `activityLogger.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 38`** (2 nodes): `startSelfPinging()`, `keepWarm.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 39`** (2 nodes): `Travel CRM Core`, `Consolidated Sync Endpoint (/api/sync)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 40`** (2 nodes): `JWT Authentication`, `User Roles (Admin, Agent, Marketer)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 41`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 42`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 43`** (1 nodes): `client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 44`** (1 nodes): `BottomNav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 45`** (1 nodes): `Sidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 46`** (1 nodes): `dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 47`** (1 nodes): `dropdown-menu.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 48`** (1 nodes): `ActionDropdown.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 49`** (1 nodes): `EditModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 50`** (1 nodes): `RequirementsCell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 51`** (1 nodes): `AddUserModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Components 52`** (1 nodes): `EditUserModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 53`** (1 nodes): `Users.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 54`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 55`** (1 nodes): `countryCodes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 56`** (1 nodes): `check.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 57`** (1 nodes): `test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 58`** (1 nodes): `server.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Controllers 59`** (1 nodes): `analyticsController.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Controllers 60`** (1 nodes): `authController.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Controllers 61`** (1 nodes): `notificationController.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Controllers 62`** (1 nodes): `syncController.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Controllers 63`** (1 nodes): `userController.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 64`** (1 nodes): `Activity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 65`** (1 nodes): `Booking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 66`** (1 nodes): `Comment.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 67`** (1 nodes): `Counter.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 68`** (1 nodes): `Notification.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 69`** (1 nodes): `Passenger.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 70`** (1 nodes): `Payment.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 71`** (1 nodes): `PrimaryContact.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 72`** (1 nodes): `Traveler.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Models 73`** (1 nodes): `User.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 74`** (1 nodes): `analyticsRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 75`** (1 nodes): `authRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 76`** (1 nodes): `bookingRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 77`** (1 nodes): `externalRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 78`** (1 nodes): `notificationRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 79`** (1 nodes): `syncRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes 80`** (1 nodes): `userRoutes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 81`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MemoryCache` connect `Caching & Utilities` to `Core Module 5`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `useGlobalSync()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `touchLastSeen()` (e.g. with `.get()` and `.set()`) actually correct?**
  _`touchLastSeen()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `extractTravelInfo()` (e.g. with `.get()` and `.set()`) actually correct?**
  _`extractTravelInfo()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Travel CRM Core`, `PrimaryContact Model`, `User Roles (Admin, Agent, Marketer)` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._