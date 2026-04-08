# 🛡️ Security Audit Report: TravelCRM-main Backend

This report presents the findings of a static code-based security audit performed against the 14-point checklist. 

## Summary Table

| # | Test Case | Status | Finding |
| :--- | :--- | :--- | :--- |
| 1 | MongoDB Injection | ✅ PASS | Zod schemas strictly filter inputs before they reach Mongoose. |
| 2 | Script Injection (XSS) | ⚠️ WARNING | No input sanitization (e.g. `DOMPurify`) before database storage. |
| 3 | SQL-style Injection | ✅ PASS | No raw SQL used; Mongoose handles queries safely. |
| 4 | Large Payload (DoS) | ⚠️ WARNING | No explicit `limit` in `express.json()`. Defaults to 100kb. |
| 5 | Large Array | ❌ FAIL | `createPassengersSchema` has no max array length. |
| 6 | Invalid Data Type | ✅ PASS | Comprehensive Zod validation for all core entities. |
| 7 | Null / Missing Field | ✅ PASS | Zod correctly enforces required fields. |
| 8 | Unknown Fields | ❌ FAIL | Zod schemas omit `.strict()`. Unknown fields are ignored, not blocked. |
| 9 | Rate Limiting | ❌ FAIL | No rate-limiting middleware (e.g. `express-rate-limit`) found. |
| 10 | Replay Attack | ⚠️ WARNING | 30-day JWT expiration with no nonce/idempotency checks. |
| 11 | Deep Nesting | ⚠️ WARNING | No explicit depth limit for JSON parsing. |
| 12 | Header Manipulation | ✅ PASS | Standard header handling; no sensitive logic dependent on headers. |
| 13 | Auth Bypass / Domain Guard | ⚠️ WARNING | Production CORS allows all origins; sessions are long-lived. |
| 14 | Content-Type | ⚠️ WARNING | No strict `application/json` enforcement for non-GET requests. |

---

## Detailed Findings & Recommendations

### 1. Large Array (Checklist #5)
> [!CAUTION]
> **Finding**: The `createPassengersSchema` in `travel-crm-backend/src/types/index.ts` validates passenger objects but does not limit the total number of items in the array.
> **Impact**: An attacker could send a POST request with an array of 100,000+ passengers, potentially causing a "denial of service" by exhausting CPU or memory during validation and DB insertion.
> **Recommendation**: Add `.max(100)` (or a reasonable limit) to the array schema.

### 2. Rate Limiting (Checklist #9)
> [!IMPORTANT]
> **Finding**: No global or route-specific rate limiting is implemented in `server.ts`.
> **Impact**: The API is vulnerable to brute-force attacks on `/api/auth/login` and DoS attacks through rapid request firing.
> **Recommendation**: Implement `express-rate-limit` with strict limits for auth routes and reasonable limits for general API routes.

### 3. Unknown Fields Blocking (Checklist #8)
> [!NOTE]
> **Finding**: Zod schemas are missing the `.strict()` modifier.
> **Impact**: While Zod strips unknown fields during parsing, it does not throw an error (400 Bad Request). This violates your requirement for "extra=forbid".
> **Recommendation**: Append `.strict()` to all shared Zod schemas in `types/index.ts`.

### 4. Input Sanitization / XSS (Checklist #2)
> [!WARNING]
> **Finding**: Fields like `requirements` and `contactName` are saved directly to MongoDB without sanitization. 
> **Impact**: If an administrative user views a malicious booking containing `<script>alert('xss')</script>`, the script could execute in their browser context.
> **Recommendation**: Sanitize strings using a library like `he` or `DOMPurify` before database insertion, particularly for "Detailed Requirements".

### 5. Production CORS Policy (Checklist #13)
> [!WARNING]
> **Finding**: `server.ts` line 43 allows all origins in production mode.
> **Impact**: This increases the surface area for CSRF and unauthorized cross-domain requests.
> **Recommendation**: Restrict the `origin` array to specific production domains (e.g. `your-crm.vercel.app`).
