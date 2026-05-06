# 🐛 Common Bugs, Gotchas & Technical Debt

> Things a new developer MUST know to avoid frustration.

---

## 🚨 Critical Gotchas

### 1. PrimaryContact ↔ Booking Field Mapping
The frontend expects fields like `contactPerson`, `contactNumber`, and `bookingType` as `"B2B"` or `"B2C"`.

But the database stores them in the **PrimaryContact** model as `contactName`, `contactPhoneNo`, and `bookingType` as `"Agent (B2B)"` / `"Direct (B2C)"`.

**The mapping happens in the controllers**, not the models. Every controller that returns booking data must do:
```typescript
contactPerson: primaryContact?.contactName,
contactNumber: primaryContact?.contactPhoneNo,
bookingType: primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
```

> ⚠️ If you add a new endpoint that returns bookings, **you must include this mapping** or the frontend will show empty fields.

---

### 2. Passengers vs. Travelers — Naming Confusion
The codebase has both `Passenger` and `Traveler` models:

| Model | Status | Used By |
|---|---|---|
| `Passenger` | **Active** | All current code, API endpoints |
| `Traveler` | **Legacy** | Migration/compatibility only |

The frontend types use `travelers`, but the API returns data from the `Passenger` model mapped as `travelers`:
```typescript
travelers: (booking as any).passengers,
```

> ⚠️ Always use the `Passenger` model for new code. The `Traveler` model exists only for backward compatibility.

---

### 3. Route Order in `bookingRoutes.ts`
Express routes are matched top-to-bottom. Named routes like `/stats`, `/recent`, `/calendar` **must** come BEFORE the `/:id` route:

```typescript
// ✅ CORRECT — Named routes first
router.get('/stats', getBookingStats);
router.get('/recent', getRecentBookings);
router.get('/calendar', getCalendarBookings);
router.route('/:id').get(getBookingById);  // After!

// ❌ WRONG — "stats" would be treated as a booking ID
router.route('/:id').get(getBookingById);
router.get('/stats', getBookingStats);  // Never reached!
```

---

### 4. Duplicate Routes in `userRoutes.ts`
There are duplicate route registrations in `userRoutes.ts`:
```typescript
// These appear TWICE:
router.post('/', protect, adminGuard, createUser);
router.delete('/:id', protect, adminGuard, deleteUser);
```
The duplicates don't cause errors (Express adds both handlers), but they should be cleaned up.

---

### 5. Cache Invalidation After Mutations
Every mutation (create, update, delete) **must** call `invalidateBookingCaches()` before responding:
```typescript
const invalidateBookingCaches = () => {
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');
    appCache.invalidateByPrefix('booking_');
};
```

If you forget this, users will see stale data for up to 60-120 seconds.

Also, user mutations should call `appCache.invalidateByPrefix('users_');`

And notification mutations: `appCache.invalidateByPrefix('notifications_');`

---

### 6. The "Website Lead" System Account
The WordPress integration creates a hidden system user:
```
email: website-lead@system.internal
name: Website Lead
role: AGENT
passwordHash: "SYSTEM_NO_LOGIN"
```

This user:
- **Owns** all bookings created from WordPress
- Should be **hidden** from the UI (filtered in frontend components)
- **Cannot log in** (passwordHash is not a real bcrypt hash)
- Is auto-created on first external lead submission

> ⚠️ Do NOT delete this user from the database. It will be re-created automatically, but all existing WordPress bookings will lose their "createdBy" reference.

---

### 7. `finalQuotation` Field Type
The `finalQuotation` field in the Booking model is a **String** (not a Number). This was intentionally changed to support text-based quotation references (e.g., "Q-2026-042") instead of just numbers.

The Zod schema defines it as `z.string().optional().nullable()`.

---

### 8. CORS is Wide Open
The backend's CORS config currently allows **all origins**:
```typescript
callback(null, true); // Allow all origins for now in production
```
This was done for development convenience. In a production environment, you should restrict this to your Vercel domain.

---

### 9. Auth Seed Route is Exposed
There's a `GET /api/auth/seed` route that **wipes all users and re-creates demo accounts**. This is marked as "temporary" but is still live.

> ⚠️ Remove or protect this route before handing off to production!

---

## 🔧 Known Technical Debt

### 1. BookingTravelers.tsx is Too Large (66 KB)
This single file handles the entire "Finalize Booking" page. It should ideally be split into:
- `PassengerForm` component
- `FlightDetailsForm` component
- `MultiCitySegmentsForm` component
- `BookingTravelers` as a container

### 2. BookingDetails.tsx is Too Large (49 KB)
Similar to above — should be decomposed into smaller section components.

### 3. bookingController.ts is Too Large (~1100 lines)
Consider splitting into separate files:
- `bookingCrud.ts` (get, create, update, delete)
- `bookingPassengers.ts` (add, update passengers)
- `bookingPayments.ts` (add, get, delete payments)
- `bookingMisc.ts` (comments, calendar, activity, stats)

### 4. No Automated Tests
There are no unit tests, integration tests, or E2E tests. Consider adding:
- Jest for backend controller tests
- React Testing Library for frontend components
- Playwright / Cypress for E2E testing

### 5. No Input Rate Limiting
The API has no rate limiting. Any user can spam requests. Consider adding:
- `express-rate-limit` middleware
- Stricter rate limits on auth routes (prevent brute force)

### 6. Socket.io is Set Up But Not Used
`socket.ts` initializes Socket.io but it's never actually connected to the HTTP server in `server.ts`. If you want real-time updates:
1. Import `initSocket` in `server.ts`
2. Replace `app.listen` with an HTTP server
3. Pass it to `initSocket`
4. Emit events on mutations

### 7. Error Handling Could Be Better
Currently, errors just throw `new Error('message')`. Consider:
- Custom error classes (NotFoundError, UnauthorizedError, etc.)
- More specific error codes
- Consistent error response format

### 8. No Pagination on Comments/Payments
Comments and payments are returned as full arrays with no pagination. For bookings with hundreds of comments, this could become a performance issue.

---

## 🔍 Debugging Tips

### Backend
- Use `morgan` logs to trace API requests (auto-enabled)
- Performance timing is already in place (`console.time`, `console.log`)
- Check `[CACHE HIT]` logs to verify caching behavior
- Use `/test-db` endpoint to verify MongoDB connection

### Frontend
- React Query DevTools can be added for debugging:
  ```tsx
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
  // Add inside QueryClientProvider:
  <ReactQueryDevtools initialIsOpen={false} />
  ```
- Check `localStorage.getItem('token')` in browser console to verify auth
- Network tab to inspect API requests/responses
- Console errors for React rendering issues

### Database
- Use MongoDB Atlas → Collections to inspect/query data directly
- Check index usage with `db.bookings.getIndexes()`
- Monitor connection pool usage in Atlas metrics

---

## 📝 Coding Patterns to Follow

### Backend Pattern: Controller Function
```typescript
export const myFunction = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate input with Zod
    const result = mySchema.safeParse(req.body);
    if (!result.success) { res.status(400); throw new Error('Invalid input'); }

    // 2. Check authorization
    if (req.user?.role !== 'ADMIN') { res.status(403); throw new Error('Not authorized'); }

    // 3. Perform operation
    const data = await Model.find({}).lean();

    // 4. Invalidate caches if mutation
    invalidateBookingCaches();

    // 5. Return response
    res.json(data);
});
```

### Frontend Pattern: Data Fetching with TanStack Query
```typescript
// In a page or component:
const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', page, status],
    queryFn: () => api.get('/bookings', { params: { page, status } }).then(r => r.data),
});
```

### Frontend Pattern: Mutation with Optimistic Updates
```typescript
const mutation = useMutation({
    mutationFn: (data) => api.post('/bookings', data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['global-sync'] });
        toast.success('Created!');
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed');
    },
});
```

---

## 📋 Pre-Handoff Checklist

- [ ] Change default admin password in production
- [ ] Remove or protect `GET /api/auth/seed` route
- [ ] Set proper CORS origins instead of allowing all
- [ ] Ensure `EXTERNAL_API_KEY` is a strong, unique value
- [ ] Verify MongoDB Atlas IP whitelist includes deployment IPs
- [ ] Set up monitoring (UptimeRobot or similar for health endpoint)
- [ ] Remove duplicate routes in `userRoutes.ts`
- [ ] Document any custom changes made after this handoff

---

### 10. Mongoose Populated ObjectIDs and Authorization Checks
When objects are populated (e.g., `booking.assignedToUserId`), the field holds a full Mongoose Document object rather than a simple `ObjectId`. Using direct `.toString()` comparison might return `[object Object]` or throw an error, causing authorization logic to fail and return `403 Forbidden` incorrectly. 
Always ensure you safely extract the ID using an overarching helper like `getObjectIdString` when writing auth conditionals:
```typescript
const getObjectIdString = (field: any): string | null => {
    if (!field) return null;
    return (field as any)._id?.toString() || field.toString();
};
```
