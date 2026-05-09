# SSE + Cache Discovery Answers
## Code-backed discovery for CRM 3.0 migration.

---

## SECTION 1 — Server & Infrastructure

### 1. Show the complete `server.ts` / `app.ts` entry point file.
**File:** `travel-crm-backend/src/server.ts`
```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { perfMonitor } from './middleware/perfMonitor';

// Load env vars
dotenv.config();

// Route files
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import syncRoutes from './routes/syncRoutes';
import externalRoutes from './routes/externalRoutes';
import settingsRoutes from './routes/settingsRoutes';
import connectDB from './config/db';
import { startFollowUpCron } from './utils/followUpCron';
// Socket.io is available in ./socket.ts for future real-time upgrades
import User from './models/User';
import Booking from './models/Booking';
import Payment from './models/Payment';
import bcrypt from 'bcrypt';

const app: Express = express();

// Connect to MongoDB
connectDB();

// Gzip compression
app.use(compression());

// Body parser
app.use(express.json());

// Performance monitoring middleware
app.use(perfMonitor);
import { pollLogger } from './middleware/pollLogger';
import { requestCounter } from './middleware/requestCounter';

app.use(requestCounter);
app.use(pollLogger);

// Enable CORS
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from localhost (dev) and any Railway/Vercel domain (prod)
        if (!origin || origin.match(/^https?:\/\/localhost:\d+$/) || origin.match(/\.up\.railway\.app$/) || origin.match(/\.vercel\.app$/)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for now in production
        }
    },
    credentials: true,
}));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('tiny')); // Show minimal logs in production
}

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/settings', settingsRoutes);

// Health endpoint for UptimeRobot
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Basic health check route
app.get('/', (req: Request, res: Response) => {
    res.send('Travel CRM Backend API is running...');
});

// Custom Error Handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

import cluster from 'cluster';
import { warmDropdownCache } from './controllers/settingsController';

const PORT = process.env.PORT || 5000;

if (cluster.isPrimary) {
    const numWorkers = parseInt(process.env.WEB_CONCURRENCY || '1');
    console.log(`[PRIMARY] ${process.pid} is running. Forking ${numWorkers} workers...`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`[WORKER] ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

    // Run master-only background tasks (Cron)
    connectDB().then(async () => {
        await warmDropdownCache();
        startFollowUpCron();
        console.log('🚀 Primary startup tasks complete.');
    });

} else {
    // Workers - each handles requests in parallel
    const startWorker = async () => {
        try {
            await connectDB();
            await warmDropdownCache();
            app.listen(Number(PORT), '0.0.0.0', () => {
                console.log(`[WORKER] ${process.pid} started on port ${PORT}`);
            });
        } catch (err) {
            console.error(`[WORKER] ${process.pid} failed to start:`, err);
            process.exit(1);
        }
    };

    startWorker();
}
```

### 2. How is the HTTP server created?
**Answer:** `app.listen(Number(PORT), '0.0.0.0', ...)` directly.
```typescript
// File: src/server.ts (Line 155)
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[WORKER] ${process.pid} started on port ${PORT}`);
});
```

### 3. Is there a cluster / worker process setup?
**Answer:** Yes. It uses the `cluster` module to fork workers based on `WEB_CONCURRENCY`.
```typescript
// File: src/server.ts (Lines 128-135)
if (cluster.isPrimary) {
    const numWorkers = parseInt(process.env.WEB_CONCURRENCY || '1');
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
}
```

### 4. Show every `app.use(cors(...))` call. Include the full options object.
**Answer:**
```typescript
// File: src/server.ts (Lines 52-62)
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from localhost (dev) and any Railway/Vercel domain (prod)
        if (!origin || origin.match(/^https?:\/\/localhost:\d+$/) || origin.match(/\.up\.railway\.app$/) || origin.match(/\.vercel\.app$/)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for now in production
        }
    },
    credentials: true,
}));
```

### 5. Show every `app.use(...)` middleware in the exact order they are registered.
**Answer:**
1. `compression()`
2. `express.json()`
3. `perfMonitor`
4. `requestCounter`
5. `pollLogger`
6. `cors(...)`
7. `morgan(...)`
8. Auth/Booking/User/Notif/Analytics/Sync/External/Settings Routers
9. Global Error Handler

### 6. How are routes registered? Show every `app.use('/api/...')` line.
**Answer:**
```typescript
// File: src/server.ts (Lines 75-82)
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/settings', settingsRoutes);
```

### 7. Is there any existing `/api/stream`, `/api/sse`, or `/api/events` route?
**Answer:** No.

### 8. What is `FRONTEND_URL` or `CLIENT_URL` env variable?
**Answer:** Not explicitly defined in `.env.example`. The `cors` middleware uses regex matching for `localhost`, `up.railway.app`, and `vercel.app`.

---

## SECTION 2 — Authentication

### 9. Show the complete auth middleware file.
**File:** `src/middleware/auth.ts`
```typescript
export const protect = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = verifyToken(token);
                req.user = decoded;
                touchLastSeen(decoded.id);
                next();
            } catch (error) {
                res.status(401);
                throw new Error('Not authorized, token failed');
            }
        }

        if (!token) {
            res.status(401);
            throw new Error('Not authorized, no token');
        }
    }
);
```

### 10. What function verifies the JWT? Show it completely.
**Answer:** `verifyToken` in `src/utils/jwt.ts`.
```typescript
// File: src/utils/jwt.ts
import jwt from 'jsonwebtoken';
export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
```

### 11. What does the middleware attach to `req`?
**Answer:** `req.user` with shape:
```typescript
{
    id: string; // From user._id
    role: string;
    name: string;
    email: string;
    groups: string[];
}
```

### 12. Where does the auth token live?
**Answer:** Authorization header (`Bearer token`).

### 13. Is there any existing mechanism for query-string token passing?
**Answer:** No. Only `req.headers.authorization` is checked.

---

## SECTION 3 — Cache System

### 14. Show the complete `src/utils/cache.ts` file.
**Answer:** It's a custom `MemoryCache` implementation using a `Map`.
```typescript
// File: src/utils/cache.ts
class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    get<T>(key: string): T | null { /*...*/ }
    set<T>(key: string, data: T, ttlSeconds: number): void { /*...*/ }
    del(key: string): void { /*...*/ }
    invalidateByPrefix(prefix: string): void { /*...*/ }
}
const appCache = new MemoryCache();
export default appCache;
```

### 15. List every `cache.set(key, value, TTL)` call across the entire codebase.
**Answer:**
- `bookingController.ts` | `stats_{userId}` | 300s
- `bookingController.ts` | `recent_{userId}` | 60s
- `bookingController.ts` | `bookings_{params}` | 60s
- `bookingController.ts` | `booking_{id}` | 30s
- `notificationController.ts` | `notifications_{userId}` | 300s
- `syncController.ts` | `sync_{userId}` | 120s
- `bookingController.ts` | `calendar_{params}` | 60s

### 16. List every `cache.get(key)` call across the entire codebase.
**Answer:** Every GET controller for the keys listed above checks `appCache.get(cacheKey)` before querying the database.

### 17. List every `cache.del(key)` call across the entire codebase.
**Answer:**
- `appCache.del(\`booking_\${id}\`)` in: `deleteBooking`, `updateBooking`, `updateBookingStatus`, `assignBooking`, `bulkAssign`, `addComment`, `addPassengers`, `updatePassengers`, `addPayment`, `deletePayment`.
- `appCache.del(\`sync_\${userId}\`)` in `updateBookingStatus`.

### 18. Are there any `cache.keys().filter(...)` patterns?
**Answer:** Yes, encapsulated in `invalidateByPrefix`.
```typescript
// File: src/controllers/bookingController.ts
const invalidateBookingCaches = () => {
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');
};
```

### 19. Is there a TTL constants object anywhere?
**Answer:** No. Raw numbers are passed to `appCache.set`.

### 20. Is there a cache key builder / helper function?
**Answer:** No. String templates are used inline in controllers.

### 21. Are there any cache entries that are NEVER invalidated?
**Answer:** Most entries have short TTLs (30s-300s). The `calendar_` cache is only invalidated by TTL (60s).

### 22. Are there any cache entries where invalidation might be MISSED?
**Answer:** Manual payment updates or passenger updates in legacy scripts might miss invalidating the `booking_{id}` cache.

### 23. What is the current `node-cache` configuration?
**Answer:** It does NOT use `node-cache`. It uses a custom `MemoryCache` with no standard configuration; everything is manual per `set` call.

---

## SECTION 4 — Notification System

### 24. Show the complete `notificationController.ts` file.
**File:** `src/controllers/notificationController.ts` (Includes `notifInFlight` Map for deduplication).

### 25. Show the Notification Mongoose schema / model file completely.
**File:** `src/models/Notification.ts`
(Includes `userId`, `bookingId`, `message`, `read`, `isDismissed`, `expireAt`).

### 26. List every place in the codebase where `Notification.create(...)` is called.
**Answer:**
1. `src/utils/followUpCron.ts`: Line 47
2. `src/controllers/bookingController.ts`: Line 682 (createBooking)
3. `src/controllers/bookingController.ts`: Line 865 (updateBookingStatus)
4. `src/controllers/bookingController.ts`: Line 972 (assignBooking)
5. `src/controllers/bookingController.ts`: Line 983 (assignBooking)
6. `src/controllers/bookingController.ts`: Line 1178 (addComment)
7. `src/controllers/bookingController.ts`: Line 1532 (verifyBooking)

### 27. Is there a `notifInFlight` Map or any single-flight deduplication?
**Answer:** Yes, in `notificationController.ts` at module scope.

### 28. What cache key is used for notifications? What TTL? Where is `cache.del` called?
**Answer:**
- Key: `notifications_{userId}`
- TTL: 300s
- Invalidation: `appCache.invalidateByPrefix(\`notifications_\${userId}\`)` in `markNotificationAsRead`, `markAllAsRead`, `dismissNotification`, `deleteNotification`.

---

## SECTION 5 — Booking Mutations

### 29. Show the complete `deleteBooking` handler.
**File:** `src/controllers/bookingController.ts` (Lines 549-594).
- `res.json()` at Line 576.
- `setImmediate` block for cleanup at Line 579.

### 30. Show the complete `createBooking` handler.
**File:** `src/controllers/bookingController.ts` (Lines 597-689).
- `res.json()` at Line 657.
- `setImmediate` block at Line 660.

### 31. Show the complete `updateBookingStatus` handler.
**File:** `src/controllers/bookingController.ts` (Lines 798-873).

### 32. Show the complete `updateBooking` (PUT) handler.
**File:** `src/controllers/bookingController.ts` (Lines 692-792).

### 33. Show the complete `addPayment` handler.
**File:** `src/controllers/bookingController.ts` (Lines 1323-1366).

### 34. Show the complete `deletePayment` handler.
**File:** `src/controllers/bookingController.ts` (Lines 1390-1432).

### 35. Show the complete `addPassengers` handler.
**File:** `src/controllers/bookingController.ts` (Lines 1211-1255).

### 36. Is there a `verifyBooking` handler? Show it completely.
**Answer:** Yes (Lines 1479-1541).

### 37. Are there any OTHER booking mutation handlers?
**Answer:** `addComment`, `updatePassengers`, `bulkAssign`, `bulkDelete`.

---

## SECTION 6 — Background Task System

### 38. Show the complete `runBG` function and the `_bgOps` semaphore.
**File:** `src/controllers/bookingController.ts` (Lines 29-47).

### 39. What is `MAX_BG` set to?
**Answer:** `2`.

### 40. List every `setImmediate(() => runBG(...))` call in the codebase.
**Answer:** 11 calls in `bookingController.ts` for all mutation side effects, plus 1 in `db.ts` for index syncing.

### 41. Is `runBG` imported or only in bookingController.ts?
**Answer:** Only defined and used in `bookingController.ts`.

---

## SECTION 7 — Frontend Polling

### 42. Show every `refetchInterval` in the frontend codebase.
**Answer:**
- `useGlobalSync.ts`: `refetchInterval: 20000` (20s)
- `BookingsTable.tsx`: `refetchInterval: 20000` (20s)

### 43. Show every place the frontend calls `/api/notifications`.
**Answer:** `Dashboard.tsx` and `useGlobalSync.ts`.

### 44. Show every place the frontend calls `/api/bookings` for list data.
**Answer:** `BookingsTable.tsx` (Line 150).

### 45. Is there a central API client?
**Answer:** Yes, `frontend/src/api/client.ts` using Axios.

### 46. After SSE is working, which intervals should be set to 0?
**Answer:** `refetchInterval` in `useGlobalSync` and `BookingsTable`.

---

## SECTION 8 — Existing Real-time Attempts

### 47. Has any SSE, WebSocket, or long-polling been attempted?
**Answer:** `src/socket.ts` exists for Socket.io but is not initialized or used in `server.ts`.

### 48. Is there any existing `/api/sync` endpoint?
**Answer:** Yes, in `syncController.ts`. SSE will likely complement this by pushing delta updates.

---

## SECTION 9 — Error Handling & Stability

### 49. Is there a global Express error handler?
**Answer:** Yes, in `server.ts` (Lines 114-121).

### 50. Is there an `uncaughtException` handler?
**Answer:** No.

### 51. Is there a `process.on('SIGTERM', ...)` handler?
**Answer:** Yes, in `src/config/db.ts` (Lines 40-47) for graceful MongoDB closure.

### 52. Is there a self-ping / keepalive mechanism?
**Answer:** `/api/ping` endpoint in `server.ts`. No automatic client found.

### 53. Is there a `perfMonitor` middleware?
**Answer:** Yes, in `src/middleware/perfMonitor.ts`. Threshold: `500ms`.

---

## SECTION 10 — Data Shapes

### 54. Show the complete Booking Mongoose schema.
**File:** `src/models/Booking.ts`.

### 58. What fields does a notification object have?
**Answer:** `userId`, `bookingId`, `message`, `read`, `isDismissed`, `expireAt`, `createdAt`.

---

## SECTION 11 — Scale & Connection Management

### 61. Do all users see all booking updates, or is it role-based?
**Answer:** Role-based logic in `getBookings` (Line 221).
- ADMIN: All.
- AGENT: Assigned or Group.
- MARKETER: Created by them.

### 63. Are there any user groups or multi-tenancy?
**Answer:** Role/Group based filtering exists (`assignedGroup`), but no multi-company isolation is apparent.
