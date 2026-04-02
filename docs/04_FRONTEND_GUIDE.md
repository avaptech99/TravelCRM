# 🖥️ Frontend Guide

> Complete guide to the frontend codebase: `frontend/`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Entry Point & App Shell](#2-entry-point--app-shell)
3. [Routing](#3-routing)
4. [Authentication Flow](#4-authentication-flow)
5. [State Management](#5-state-management)
6. [API Layer](#6-api-layer)
7. [Layout & Navigation](#7-layout--navigation)
8. [Pages Explained](#8-pages-explained)
9. [Feature Components](#9-feature-components)
10. [Styling System](#10-styling-system)
11. [How To Add a New Page](#11-how-to-add-a-new-page)
12. [How To Add a New Modal/Feature Component](#12-how-to-add-a-new-modalfeature-component)

---

## 1. Architecture Overview

```
main.tsx                    ← ReactDOM render
    └── ErrorBoundary       ← Catches crashes
        └── App             ← QueryClient + AuthProvider + Router
            └── BrowserRouter
                ├── /login                → Login
                └── <ProtectedRoute>      ← Checks JWT
                    └── <MainLayout>      ← Sidebar + Topbar + BottomNav
                        ├── /             → Dashboard
                        ├── /bookings     → Bookings
                        ├── /my-bookings  → MyBookings
                        ├── /calendar     → CalendarView
                        ├── /bookings/:id → BookingDetails
                        ├── /bookings/:id/travelers → BookingTravelers
                        ├── /booked       → BookedEDT
                        ├── /reports      → Reports
                        ├── /users        → Users
                        └── /settings     → Settings
```

### Key Libraries

| Library | Purpose | Usage |
|---|---|---|
| **React 19** | UI framework | Components, hooks, context |
| **React Router v7** | Routing | Page navigation, URL params |
| **TanStack Query v5** | Server state management | Data fetching, caching, polling |
| **TanStack Table v8** | Data tables | BookingsTable with sorting, filtering |
| **React Hook Form v7** | Form handling | All modals and forms |
| **Zod v4** | Validation | Form input validation |
| **Axios** | HTTP client | API communication |
| **dayjs** | Date formatting | Display dates in UI |
| **Recharts v3** | Charts | Dashboard + Reports visualizations |
| **Lucide React** | Icons | All icons throughout the app |
| **Sonner** | Toast notifications | Success/error messages |
| **Radix UI** | Primitives | Dialog, Dropdown Menu components |

---

## 2. Entry Point & App Shell

### `main.tsx`
```
React.StrictMode → ErrorBoundary → App
```

### `App.tsx`
Sets up three critical wrappers (order matters!):
1. **QueryClientProvider** — TanStack Query with custom config:
   - `staleTime: 60s` — Data considered fresh for 60 seconds
   - `gcTime: 10min` — Cached data kept for 10 minutes
   - `refetchOnWindowFocus: false` — Prevents re-fetching when switching tabs
   - `retry: 2` — Retries failed requests twice with exponential backoff
2. **AuthProvider** — Provides user/token context
3. **BrowserRouter** — React Router

### Page Lazy Loading
All pages (except Login) are lazy-loaded to reduce initial bundle size:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
```
While loading, a spinner is shown via `<Suspense fallback={<PageLoader />}>`.

---

## 3. Routing

| Path | Component | Access |
|---|---|---|
| `/login` | Login | Public |
| `/` | Dashboard | All authenticated users |
| `/bookings` | Bookings | ADMIN, AGENT |
| `/my-bookings` | MyBookings | All authenticated users |
| `/calendar` | CalendarView | ADMIN, AGENT |
| `/bookings/:id` | BookingDetails | All (MARKETER restricted to own) |
| `/bookings/:id/travelers` | BookingTravelers | ADMIN, AGENT |
| `/booked` | BookedEDT | ADMIN, AGENT |
| `/reports` | Reports | ADMIN only |
| `/users` | Users | ADMIN only |
| `/settings` | Settings | All authenticated users |
| `*` (catch-all) | Redirect to `/` | — |

### Route Protection
- **`ProtectedRoute`** wraps all authenticated routes
- Checks `isAuthenticated` from AuthContext
- Redirects to `/login` if no valid token
- Role-based access is handled within each page component (not at route level)

---

## 4. Authentication Flow

### Login
1. User submits email/password on Login page
2. Frontend calls `POST /api/auth/login`
3. Backend returns `{ token, name, email, role }`
4. Token stored in `localStorage` via `AuthContext.login(token)`
5. `useEffect` decodes JWT with `jwt-decode` to extract user info
6. User redirected to Dashboard

### Token Management
- Token stored in `localStorage` key: `token`
- **Axios interceptor** (in `api/client.ts`) automatically adds `Bearer <token>` to all requests
- **401 interceptor**: If any API returns 401 (except login), token is cleared and user redirected to `/login`

### Logout
```typescript
const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    queryClient.clear(); // Clears all cached TanStack Query data
};
```

---

## 5. State Management

### Server State: TanStack Query
All data from the backend is managed by TanStack Query. **There is no Redux or Zustand.**

#### Query Key Conventions
```typescript
['global-sync', userId]          // Dashboard sync data
['bookings', { status, search, page, ... }]  // Booking list
['booking', bookingId]           // Single booking
['users']                        // User list
// etc.
```

#### Data Freshness
- `staleTime: 60s` globally — avoids unnecessary refetches
- `refetchInterval: 20s` on the sync hook — provides near-real-time dashboard updates
- On mutations (create, update, delete), relevant queries are **invalidated** via `queryClient.invalidateQueries()`

### Client State: React Context
Only used for authentication state via `AuthContext`:
```typescript
const { token, user, login, logout, isAuthenticated } = useAuth();
```

### Global Sync Hook (`useGlobalSync.ts`)
This is the primary data source for the Dashboard:
```typescript
const { data: syncData } = useGlobalSync();
// syncData.stats      → { total, booked, pending, working, sent, agents }
// syncData.recentBookings → latest 5 bookings
// syncData.notifications → latest 20 notifications
```
- Polls every **20 seconds**
- Stale after **15 seconds**
- Only enabled when user is logged in

---

## 6. API Layer

### `api/client.ts`
Centralized Axios instance:
```typescript
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});
```

**Request Interceptor:** Attaches JWT token from localStorage
**Response Interceptor:** Handles 401 (auto-logout), skips login endpoint

### How API Calls Are Made (Pattern)
```typescript
// In a component or hook:
const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/bookings').then(res => res.data),
});

// For mutations:
const mutation = useMutation({
    mutationFn: (data) => api.post('/bookings', data),
    onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
        toast.success('Booking created!');
    },
});
```

### Environment Variable
```
VITE_API_URL=https://your-backend.onrender.com/api
```
Set this in Vercel's environment settings for production.

---

## 7. Layout & Navigation

### `MainLayout.tsx`
The page shell for all authenticated pages:
```
┌─────────────────────────────────────────────┐
│ Topbar (notifications, search, user menu)   │
├─────────┬───────────────────────────────────┤
│         │                                   │
│ Sidebar │        <Outlet /> (page content)  │
│ (desktop│                                   │
│  only)  │                                   │
│         │                                   │
├─────────┴───────────────────────────────────┤
│ BottomNav (mobile only)                     │
└─────────────────────────────────────────────┘
```

### `Sidebar.tsx` (Desktop)
- Shows role-filtered navigation items
- Active state based on current URL
- Displays user name and role at bottom
- Hidden on mobile (`hidden md:flex`)

### `BottomNav.tsx` (Mobile)
- Fixed bottom navigation bar
- Shows on mobile only (`md:hidden`)
- Same role-based filtering as sidebar

### `Topbar.tsx`
- Notification bell with unread count
- Search functionality
- User dropdown menu (profile, logout)
- Mobile menu toggle

---

## 8. Pages Explained

### `Login.tsx` (7.9 KB)
- Standalone page (no layout)
- Form with email/password fields
- Calls `POST /api/auth/login`
- Error handling with toast notifications
- Redirects to `/` on success

### `Dashboard.tsx` (16.8 KB)
- **Stats Cards**: Total, Pending, Working, Sent, Booked counts
- **Recent Bookings**: Table showing latest 5 bookings
- **Uses:** `useGlobalSync()` hook for all data
- Role-aware: Agents see only their stats, Admins see everything

### `Bookings.tsx` (9 KB)
- **BookingsTable** wrapper with filter controls
- Status filter, agent filter, search bar, date filters
- Pagination handling
- "New Booking" button opens `NewBookingModal`

### `MyBookings.tsx` (7.3 KB)
- Similar to Bookings but filtered to current user
- Used by Agents (assigned/created bookings) and Marketers (created leads)

### `BookingDetails.tsx` (49 KB) — VERY LARGE
This is a detailed view for a single booking. Contains:
- Booking info display (code, status, contact, dates, flights)
- Edit booking modal
- Comments/remarks section
- Payments section with add/delete
- Passenger/traveler summary
- Activity log
- Status update controls
- Agent assignment

### `BookingTravelers.tsx` (66 KB) — THE LARGEST FILE
The "Finalize Booking" page where agents:
- Add/edit passenger details (name, DOB, phone, email)
- Set flight details per passenger (from, to, times)
- Handle round-trip return flights
- Handle multi-city segments
- Auto-populate from AI-extracted data
- Save all traveler data at once

> ⚠️ **This file is the most complex and fragile. Be very careful when editing it.**

### `CalendarView.tsx` (19.5 KB)
- Month-view calendar showing travel dates
- Color-coded by booking status
- Click on a date to see bookings
- Month/year navigation

### `Reports.tsx` (16.7 KB)
- **Admin only** — Analytics dashboard
- Booking status distribution (pie chart)
- Revenue trends (line chart)
- Agent performance table (bookings, conversion rate, revenue)
- Payment summary
- Date range filtering
- Uses Recharts for visualizations

### `Users.tsx` (27.9 KB)
- **Admin only** — User management page
- Table of all users with online status
- Create new user button → `AddUserModal`
- Edit user → `EditUserModal`
- Delete user (with confirmation)
- Unassign bookings feature
- Hides "Website Lead" system account from UI

### `Settings.tsx` (13.1 KB)
- Profile editing (name, email)
- Password change → `ChangePasswordModal`
- App settings/preferences

### `BookedEDT.tsx` (2.3 KB)
- Filtered view showing only `status: Booked` bookings
- Quick access for agents working on finalized bookings

---

## 9. Feature Components

### `features/bookings/components/`

| Component | Purpose |
|---|---|
| **BookingsTable.tsx** (24 KB) | The main data table — defines columns (code, contact, destination, status, dates, actions), uses TanStack Table for sorting/pagination |
| **NewBookingModal.tsx** (9.5 KB) | Form to create a new booking (contact name, phone, type, requirements, flight details) |
| **EditModal.tsx** (11.6 KB) | Edit existing booking details (requirements, flight info, amounts) |
| **ActionDropdown.tsx** (3.8 KB) | Per-row dropdown menu (View, Edit, Assign, Status, Delete) |
| **AddPaymentModal.tsx** (13 KB) | Record payment form (amount, method, transaction ID, date, remarks) |
| **AssignAgentModal.tsx** (5.2 KB) | Dropdown to assign an agent to a booking |
| **CommentModal.tsx** (5.5 KB) | Add remark/comment to a booking |
| **StatusUpdateModal.tsx** (3.9 KB) | Change booking status (Pending → Working → Sent → Booked) |
| **RequirementsCell.tsx** (2.2 KB) | Expandable text cell for long requirement descriptions |

### `features/users/components/`

| Component | Purpose |
|---|---|
| **AddUserModal.tsx** (6 KB) | Create new user form (name, email, password, role) |
| **EditUserModal.tsx** (6.6 KB) | Edit existing user form (name, email, role, optional password reset) |

### `components/`

| Component | Purpose |
|---|---|
| **ProtectedRoute.tsx** | Route guard for authentication |
| **ErrorBoundary.tsx** | Catches React rendering errors, shows fallback UI |
| **ChangePasswordModal.tsx** | Password change form (current + new password) |
| **layout/MainLayout.tsx** | Page shell with sidebar, topbar, bottom nav |
| **layout/Sidebar.tsx** | Desktop left sidebar navigation |
| **layout/Topbar.tsx** | Top bar with notifications and user menu |
| **layout/BottomNav.tsx** | Mobile bottom tab navigation |
| **ui/dialog.tsx** | Radix UI Dialog (modal) primitive |
| **ui/dropdown-menu.tsx** | Radix UI Dropdown Menu primitive |

---

## 10. Styling System

### Stack
- **Tailwind CSS v4** — Utility-first CSS
- **`@tailwindcss/vite`** — Vite plugin integration
- **`tailwind-merge`** — Prevents conflicting Tailwind classes
- **`clsx`** — Conditional class joining
- **`class-variance-authority`** — Component variants (used in UI primitives)

### Utility Function
In `lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```
Use `cn()` everywhere for combining Tailwind classes conditionally.

### Theme Tokens
Global CSS in `index.css` defines custom properties used throughout:
- Brand colors (primary = a purple/blue gradient)
- Glassmorphism effects
- Animations and transitions
- Dark mode compatible base colors

### UI Guidelines
- **Icons:** All from `lucide-react`
- **Toasts:** `sonner` — positioned top-right with rich colors
- **Modals:** Built on Radix Dialog (`components/ui/dialog.tsx`)
- **Dropdowns:** Built on Radix Dropdown Menu
- **Responsive:** Mobile-first. Desktop sidebar hidden on mobile; bottom nav shown instead

---

## 11. How To Add a New Page

1. **Create the page component** in `src/pages/MyNewPage.tsx`:
```tsx
import { useAuth } from '../context/AuthContext';

export const MyNewPage = () => {
    const { user } = useAuth();
    
    return (
        <div>
            <h1 className="text-2xl font-bold">My New Page</h1>
            {/* Your content */}
        </div>
    );
};
```

2. **Add the lazy import** in `App.tsx`:
```typescript
const MyNewPage = lazy(() => import('./pages/MyNewPage').then(m => ({ default: m.MyNewPage })));
```

3. **Add the route** in `App.tsx` inside the `<MainLayout>` routes:
```tsx
<Route path="/my-new-page" element={<MyNewPage />} />
```

4. **Add navigation link** in `Sidebar.tsx` and `BottomNav.tsx`:
```typescript
{ label: 'My New Page', path: '/my-new-page', icon: <SomeIcon size={20} />, roles: ['ADMIN', 'AGENT'] },
```

---

## 12. How To Add a New Modal/Feature Component

1. **Create the component** in the appropriate feature folder:
```
src/features/bookings/components/MyNewModal.tsx
```

2. **Use Radix Dialog** for the modal:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

interface Props {
    open: boolean;
    onClose: () => void;
    bookingId: string;
}

export const MyNewModal = ({ open, onClose, bookingId }: Props) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>My Modal Title</DialogTitle>
                </DialogHeader>
                {/* Form / Content */}
            </DialogContent>
        </Dialog>
    );
};
```

3. **Use React Hook Form** for form handling:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ fieldName: z.string().min(1) });
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
});
```

4. **Use TanStack Query mutation** for API calls:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';

const queryClient = useQueryClient();

const mutation = useMutation({
    mutationFn: (data: FormData) => api.post(`/bookings/${bookingId}/something`, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
        toast.success('Done!');
        onClose();
    },
    onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed');
    },
});
```
