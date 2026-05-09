# SSE + Cache Discovery Questions
## Answer every question below. Code snippets required for every answer.

---

## SECTION 1 — Server & Infrastructure

1. Show the complete `server.ts` / `app.ts` entry point file.

2. How is the HTTP server created?
   - `app.listen(PORT)` directly, or
   - `const server = createServer(app)` then `server.listen(PORT)`?
   - Show the exact lines.

3. Is there a cluster / worker process setup?
   - Show any `cluster.fork()` or worker code.
   - How many workers are running? (check `WEB_CONCURRENCY` in logs)

4. Show every `app.use(cors(...))` call. Include the full options object.
   - What is the `origin` value?
   - Is `credentials: true` set?

5. Show every `app.use(...)` middleware in the exact order they are registered
   in server.ts — including auth, logging, body parser, compression, etc.

6. How are routes registered? Show every `app.use('/api/...')` line.

7. Is there any existing `/api/stream`, `/api/sse`, or `/api/events` route?
   Show it if it exists.

8. What is `FRONTEND_URL` or `CLIENT_URL` env variable?
   What domain does the frontend run on? (Vercel URL or custom domain)

---

## SECTION 2 — Authentication

9. Show the complete auth middleware file
   (`src/middleware/auth.ts` or equivalent).

10. What function verifies the JWT? Show it completely.
    - What library? (`jsonwebtoken`, `jose`, other?)
    - What does it return on success?
    - What does it return / throw on failure?

11. What does the middleware attach to `req`?
    Show the exact shape:
    ```
    req.user = { _id: '...', role: '...', ... }
    ```
    Is `_id` a Mongoose ObjectId or a string?

12. Where does the auth token live?
    - Authorization header (`Bearer token`)?
    - Cookie?
    - Both?
    Show how the middleware extracts it.

13. For SSE, the token cannot be sent in a header on the initial connection
    (browser EventSource API doesn't support custom headers).
    Is there any existing mechanism for query-string token passing?
    Example: `/api/stream?token=xxx`
    If not, is there a `httpOnly` cookie set on login that could be used?
    Show the login handler's cookie / token response.

---

## SECTION 3 — Cache System

14. Show the complete `src/utils/cache.ts` file.

15. List every `cache.set(key, value, TTL)` call across the entire codebase.
    Format:
    ```
    File: controllerName.ts | Key pattern: 'bookings_{filter}' | TTL: 30s
    ```

16. List every `cache.get(key)` call across the entire codebase.
    Same format as above.

17. List every `cache.del(key)` call across the entire codebase.
    Include which handler triggers each del.

18. Are there any `cache.keys().filter(...)` patterns?
    Show them all — these are prefix-based invalidations.

19. Is there a TTL constants object anywhere?
    Show it. If not, list the raw TTL numbers used across the codebase.

20. Is there a cache key builder / helper function?
    Show it. If not, show how cache keys are constructed (string templates).

21. Are there any cache entries that are NEVER invalidated
    (only expire by TTL)? List them.

22. Are there any cache entries where invalidation might be MISSED?
    (i.e., a write handler that modifies data but doesn't call cache.del
    for the relevant key?) List any you find.

23. What is the current `node-cache` configuration?
    Show: `stdTTL`, `checkperiod`, `useClones`, `maxKeys` if set.

---

## SECTION 4 — Notification System

24. Show the complete `notificationController.ts` file.

25. Show the Notification Mongoose schema / model file completely.

26. List every place in the codebase where `Notification.create(...)` is called.
    For each: file name, function name, line number, what data is passed.

27. Is there a `notifInFlight` Map or any single-flight deduplication?
    Show it. Is it declared at module scope (outside the handler function)?

28. What cache key is used for notifications?
    What TTL?
    Where is `cache.del('notifications_...')` called?

---

## SECTION 5 — Booking Mutations

29. Show the complete `deleteBooking` handler.
    Specifically:
    - Where is `res.json()` called relative to DB operations?
    - What is inside the `setImmediate` / `runBG` block?
    - What cache keys are deleted?

30. Show the complete `createBooking` handler.
    Same questions as above.

31. Show the complete `updateBookingStatus` handler.
    Same questions as above.

32. Show the complete `updateBooking` (PUT) handler.
    Same questions as above.

33. Show the complete `addPayment` handler.
    Same questions as above.

34. Show the complete `deletePayment` handler.
    Same questions as above.

35. Show the complete `addPassengers` handler.
    Same questions as above.

36. Is there a `verifyBooking` handler? Show it completely.

37. Are there any OTHER booking mutation handlers not listed above?
    (comments, attachments, cost items, etc.)
    List them all. Show each one.

---

## SECTION 6 — Background Task System

38. Show the complete `runBG` function and the `_bgOps` semaphore.
    Where is it declared? (top of bookingController or a shared util?)

39. What is `MAX_BG` set to? (the concurrent background task limit)

40. List every `setImmediate(() => runBG(...))` call in the codebase.
    For each: which handler, what label, what operations inside.

41. Is `runBG` imported and used in multiple controller files,
    or is it only in bookingController.ts?

---

## SECTION 7 — Frontend Polling

42. Show every `setInterval`, `refetchInterval`, `polling`, or `useQuery`
    with a refetch interval in the frontend codebase.
    For each: file, function/hook name, interval value, which endpoint.

43. Show every place the frontend calls `/api/notifications`.
    Which hook or service file?

44. Show every place the frontend calls `/api/bookings` for list data.
    Which hook or service file?

45. Is there a central API client / axios instance?
    Show it. (base URL, interceptors, headers)

46. After SSE is working, which frontend polling intervals should be set to 0
    or removed entirely? Confirm the list.

---

## SECTION 8 — Existing Real-time Attempts

47. Has any SSE, WebSocket, or long-polling been attempted before?
    Search for: `EventSource`, `WebSocket`, `ws`, `socket.io`,
    `text/event-stream`, `Transfer-Encoding: chunked`
    Show any results found.

48. Is there any existing `/api/sync` endpoint?
    Show the complete handler.
    What data does it return?
    Will SSE replace this or complement it?

---

## SECTION 9 — Error Handling & Stability

49. Is there a global Express error handler?
    Show it (`app.use((err, req, res, next) => {...})`).

50. Is there an `uncaughtException` or `unhandledRejection` handler?
    Show it.

51. Is there a `process.on('SIGTERM', ...)` graceful shutdown handler?
    Show it.

52. Is there a self-ping / keepalive mechanism?
    Show the code. What URL does it ping? What interval?

53. Is there a `perfMonitor` middleware?
    Show it completely. What threshold triggers a warning?

---

## SECTION 10 — Data Shapes (needed for SSE event payloads)

54. Show the complete Booking Mongoose schema.
    (Only fields, indexes, virtuals — not the full file if it's very long)

55. What fields does the frontend need when a booking is CREATED?
    (minimum fields to add it to the list view)

56. What fields does the frontend need when a booking STATUS changes?
    (minimum delta to update the list/detail view)

57. What fields does the frontend need when a booking is DELETED?
    (just the bookingId? anything else?)

58. What fields does a notification object have?
    Show a real example document from your database or the schema.

59. When a payment is added, what does the frontend need to refresh?
    - Just the booking detail?
    - The booking list?
    - Analytics?
    - All three?

---

## SECTION 11 — Scale & Connection Management

60. How many simultaneous users are expected?
    Maximum concurrent SSE connections at peak?

61. Do all users see all booking updates, or is it role-based?
    Examples:
    - Agents only see their assigned bookings?
    - Managers see all bookings in their group?
    - Admins see everything?
    Show the role/permission logic in getBookings.

62. When a booking is reassigned from Agent A to Agent B —
    who should receive the SSE event?
    - Agent A (to remove it from their list)?
    - Agent B (to add it to their list)?
    - Both?
    - All users?

63. Are there any user groups or multi-tenancy?
    (multiple companies / organizations in one deployment?)
    Show the group/company filtering logic in getBookings.

---

## HOW TO ANSWER

- Every answer needs the actual code snippet, not a description.
- Include the file path for every snippet.
- If something doesn't exist, say "does not exist" — don't guess.
- If you're unsure, show the closest thing you found and flag it.
- Do not write any implementation code yet.
- Do not suggest changes yet.
- Just answer the questions.
