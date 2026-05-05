# 🚨 PERFORMANCE AUDIT — React + Node.js + MongoDB
# Response Time Regression: ≤90ms → ~33,000ms (33 seconds)

---

## WHO YOU ARE & WHAT TO DO

You are a senior backend engineer specializing in Node.js and MongoDB performance.
I have a critical performance regression. My app responded in **under 90ms** before.
It now takes **~33 seconds** on the same endpoints.

**Your job:** Read every relevant file in this codebase using your IDE tools,
build a complete mental model of the data flow, find every bottleneck,
and produce a prioritized, copy-paste-ready fix plan.

Do NOT ask me to paste code. Read the files yourself.

---

## STEP 1 — EXPLORE THE PROJECT STRUCTURE

First, map the codebase. Run or read:

```
List all files and folders from the root directory (2-3 levels deep).
Identify:
- Entry point (server.js / app.js / index.js)
- Route files
- Controller files
- Middleware files
- Model / Schema files
- Database connection file
- Config / environment files
- package.json (for dependencies and versions)
- Any caching layer (redis, node-cache, in-memory)
- Any job queues or background workers
```

---

## STEP 2 — READ & UNDERSTAND THESE FILES (in order)

### 2A. Database Connection
Read the DB connection file (db.js / mongoose.js / config/db.js or similar).

**Extract:**
- How is the MongoDB connection created? (mongoose.connect / MongoClient)
- Is the connection reused across requests or created per-request?
- What is the connection pool size? (`maxPoolSize`, `poolSize`)
- Are there any connection timeouts set? (`serverSelectionTimeoutMS`, `socketTimeoutMS`)
- Is `bufferCommands` enabled? (can hide slow connection as slow query)
- Is the connection established before the server starts listening, or lazily?
- Is this deployed serverless (Lambda/Vercel/Netlify)? If yes, flag cold-start reconnection as a major issue.

---

### 2B. All Mongoose / MongoDB Models
Read every file in `models/` or `schemas/`.

**For each model, extract:**
- Collection name
- All fields and their types
- All indexes defined in the schema (`index: true`, `.index({})`, `unique: true`)
- Any `virtual` fields with complex getters
- Any `pre` / `post` hooks (these run on EVERY save/find — log them)
- Any `populate` references to other collections

**Build a table like this for each model:**
```
Model: User
Fields: _id, email, name, role, createdAt, organizationId, ...
Schema Indexes: email (unique), _id (auto)
Missing indexes: (to be determined in Step 3)
Hooks: pre('save') → password hashing
Virtuals: fullName
Populated refs: organizationId → Organization
```

---

### 2C. Entry Point & Middleware Stack
Read `server.js` / `app.js` / `index.js`.

**Extract in order:**
- All `app.use()` middleware — list them in the exact order they run
- For each middleware, note: does it hit the database? does it call an external API? is it synchronous?
- What is the middleware that runs on EVERY request vs. only certain routes?
- Is there any rate limiting, logging, or body parsing that could be slow?
- What port and mode is the server running in? Is `NODE_ENV=production` set?

---

### 2D. All Route Files
Read every file in `routes/` or `api/`.

**For each route, extract:**
- HTTP method + path (e.g., `GET /api/users/:id`)
- Which controller/handler it maps to
- Which middleware runs before the handler (auth, validation, etc.)
- Is the route handler `async`?

---

### 2E. All Controller / Handler Files
Read every file in `controllers/` or inline route handlers.

**For each handler function, extract the full data flow:**

```
Handler: getOrders
Route: GET /api/orders

Step 1: Auth middleware → reads DB? (yes/no) → uses cache? (yes/no)
Step 2: Query 1 → db.orders.find({userId}) → fields selected? → .lean()? → .limit()?
Step 3: Query 2 → db.products.find({...}) inside a loop? (N+1 FLAG 🚨)
Step 4: External API call? → awaited serially or Promise.all?
Step 5: Data transformation → O(n²) loop? large sort?
Step 6: Response sent
```

Flag every one of these patterns:
- 🚨 N+1: Any DB query inside a `for` loop, `.map()`, `.forEach()`
- 🚨 SERIAL: Multiple `await` calls that don't depend on each other (should be `Promise.all`)
- 🚨 NO-LEAN: `Model.find()` without `.lean()` on read-only queries
- 🚨 NO-SELECT: Queries fetching all fields when only 2-3 are needed
- 🚨 NO-LIMIT: Queries with no `.limit()` that could return thousands of documents
- 🚨 DEEP-POPULATE: `.populate()` chains more than 1 level deep
- 🚨 SYNC-BLOCK: Any synchronous heavy operation (JSON.parse of large object, crypto sync, fs.readFileSync)
- 🚨 MISSING-AWAIT: Any promise not awaited (silent hanging)
- 🚨 LOOP-AGGREGATE: Building results with in-memory loops that MongoDB aggregation could do

---

### 2F. Auth / Session Middleware
Read the authentication middleware file(s).

**Extract:**
- Does auth middleware query the database on every request? (e.g., `User.findById(token.id)`)
- Is the result cached (Redis, in-memory map, etc.)? TTL?
- Is JWT verified synchronously or asynchronously?
- How long does this middleware take? (estimate based on what it does)

---

### 2G. Package.json — Dependency Check
Read `package.json`.

**Extract:**
- Mongoose version (v5, v6, v7, v8 — behavior differs)
- Express version
- Any ORM/ODM wrappers on top of Mongoose
- Any heavy middleware packages (e.g., `morgan` with file logging, `helmet`, custom loggers)
- Any packages known for slowness (e.g., `bcrypt` sync usage, `moment`, `lodash` on huge arrays)
- Node.js version (check `.nvmrc`, `engines` field, or Dockerfile)

---

## STEP 3 — BUILD THE QUERY AUDIT TABLE

After reading all models and controllers, fill this table for EVERY database query found:

| # | Handler | Collection | Operation | Filter Fields | Indexed? | .lean() | .select() | .limit() | Risk |
|---|---------|------------|-----------|---------------|----------|---------|-----------|----------|------|
| 1 | getUsers | users | find | {role} | ❌ NO | ❌ | ❌ | ❌ | 🔴 HIGH |
| 2 | getOrder | orders | findById | {_id} | ✅ YES | ❌ | ❌ | N/A | 🟡 MED |
| 3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**To check if a field is indexed:**
Look in the model schema for `index: true`, `unique: true`, or `schema.index({field: 1})`.
If not found → mark as ❌ NOT INDEXED.

---

## STEP 4 — TRACE THE SLOWEST ENDPOINT COMPLETELY

Identify the endpoint most likely causing the 33s response (or the one I tell you).
Write out its COMPLETE execution trace:

```
REQUEST: GET /api/[endpoint]
│
├── Middleware 1: [name] → [what it does] → [estimated ms]
├── Middleware 2: [name] → [what it does] → [estimated ms]  
│
└── Handler: [controllerName]
    ├── await query1 → [collection].[operation]({filter}) → est. [X]ms
    │     └── Indexed? [Y/N] | .lean()? [Y/N] | Returns ~[N] docs
    ├── await query2 → [collection].[operation]({filter}) → est. [X]ms
    │     └── ⚠️ INSIDE LOOP (N+1) — runs [N] times
    ├── await externalCall → [url] → est. [X]ms
    ├── [sync transformation] → est. [X]ms
    └── res.json() → RESPONSE SENT
    
TOTAL ESTIMATED: [X]ms
LIKELY BOTTLENECK: [query2 N+1 pattern]
```

---

## STEP 5 — PRODUCE THE FIX PLAN

Now write the complete fix plan. Structure it as:

### 🔴 CRITICAL FIXES (do these first — biggest impact)

For each critical fix:
```
ISSUE: [exact description with file:line reference]
CAUSE: [why this is slow]
IMPACT: [estimated ms saved]

BEFORE:
[exact current code]

AFTER:
[exact replacement code]

VERIFICATION:
[how to confirm it worked]
```

### 🟡 IMPORTANT FIXES (do after critical)
Same format as above.

### 🟢 QUICK WINS (< 5 minutes each)
- Add `.lean()` to these queries: [list with file:line]
- Add `.select('field1 field2')` to these queries: [list with file:line]  
- Add `.limit(100)` to these queries: [list with file:line]
- Change these serial awaits to Promise.all: [list with file:line]

### 📦 MONGODB INDEXES TO CREATE
```js
// Run these in your MongoDB shell or Atlas UI:
db.[collection].createIndex({ [field]: 1 })  // fixes query in [handler] at [file:line]
db.[collection].createIndex({ [field1]: 1, [field2]: -1 })  // compound index for [query]
```

### ⚙️ CONNECTION & CONFIG FIXES
```js
// In your DB connection file:
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,          // increase from default if needed
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
```

### 🗄️ CACHING RECOMMENDATIONS
For each query that's slow but rarely changes:
```
Query: [description]
Suggested cache: [in-memory / Redis]
TTL: [X seconds]
Cache key: [example key structure]
```

---

## STEP 6 — FINAL SUMMARY

Produce a ranked table of all issues found:

| Priority | File | Line | Issue | Estimated Latency Saved |
|----------|------|------|-------|------------------------|
| 🔴 1 | controllers/order.js | 47 | N+1 query in loop (runs 50x) | ~28,000ms |
| 🔴 2 | middleware/auth.js | 12 | DB call on every request, no cache | ~2,000ms |
| 🟡 3 | models/User.js | - | Missing index on `email` field | ~500ms |
| 🟢 4 | controllers/user.js | 83 | No .lean() on read query | ~50ms |

**Projected response time after all fixes:** [X]ms

---

## KNOWN CONTEXT

- **Stack:** React (frontend) + Node.js/Express (backend) + MongoDB (via Mongoose)
- **Baseline:** ≤90ms response time
- **Current:** ~33,000ms (33 seconds)
- **Goal:** Return to ≤90ms
- **This is a regression** — the code worked fast before, something changed

Begin your audit now. Start with Step 1, read all files, then work through each step.
Do not stop to ask questions — read the files and make reasonable inferences.
