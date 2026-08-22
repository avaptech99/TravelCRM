# CRM Fix Porting Questionnaire — ANSWERS
### From: CRM 3.0 → To: CRM Final

---

## SECTION 1 — File Structure

1. **What is the tech stack of both CRM versions?**
   - **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS 4.
   - **Backend**: Node.js + Express + TypeScript + Mongoose (MongoDB).
   - **Real-time**: Socket.io + Server-Sent Events (SSE).
   - **State/Data**: TanStack Query (React Query) v5, TanStack Table v8, React Hook Form, Zod.

2. **Are the two versions in separate folders/repos, or branches of the same repo?**
   - **Path to CRM 3.0**: `c:\CRM AFTER ALL FIX BUT NO RESULT\CRM 3.0`
   - **Path to CRM Final**: [TBD - User to specify target path]

3. **Do both versions share the same file/folder structure, or has CRM Final been reorganized?**
   - CRM 3.0 uses a monorepo-style structure:
     - `/frontend`: React application.
     - `/travel-crm-backend`: Node.js/Express API.
     - `/docs`: Detailed documentation and system guides.
     - `/migration script`: Custom JS scripts for database normalization.

4. **Are there any shared components/stylesheets between the two versions, or are they fully independent codebases?**
   - Currently fully independent, but designed to be portable.

---

## SECTION 2 — Visual Fixes (UI/Styling)

5. **List every visual change made to CRM 3.0.**

   | # | Element | Change Type | File | Before | After |
   |---|---------|-------------|------|--------|-------|
   | 1 | Flight Route | SVG Arc Design | `BookingDetails.tsx` | Plain text "DXB -> LHR" | Dynamic SVG Path with curved arcs and arrowheads |
   | 2 | Airport Codes | Font/Size | `BookingDetails.tsx` | Large/Standard | Compact 2xl/3xl "Apple-style" typography |
   | 3 | Date Badges | Floating UI | `BookingDetails.tsx` | Inline text | Rounded-full badges floating above route arcs |
   | 4 | Multi-Leg UI | Layout | `BookingDetails.tsx` | Single line | Iterative segments (Leg 1, Leg 2...) for Multi-City |
   | 5 | Sidebar | Real-time Indicator | `Sidebar.tsx` | Static menu | Pulse animation for SSE connection status |
   | 6 | DatePickers | Custom Styling | `index.css` | Default browser/library | Premium rounded-lg shadow-xl UI |

6. **Were any CSS classes added, renamed, or removed?**
   - Added `@utility bg-brand-gradient`: Linear gradient for premium branding.
   - Added `@utility btn-pill`: High-fidelity rounded button style with hover scaling.
   - Added `react-datepicker` overrides for premium calendar UI.

7. **Were any global styles or CSS variables (`:root`) modified?**
   - `--primary`: Changed to `7 59% 47%` (Refined Red).
   - `--secondary`: Changed to `215 56% 54%` (Refined Blue).
   - `--radius`: Set to `0.5rem`.

8. **Were any external libraries or fonts added for the visual fixes?**
   - `lucide-react`: For iconography.
   - `framer-motion`: For premium animations (especially in `BookingDetails.tsx`).

9. **Are there any screenshots or before/after comparisons of the visual changes?**
   - See `DAILY_SUMMARY.md` for functional descriptions.

---

## SECTION 3 — Field Fixes

10. **List every field that was added, removed, renamed, or reordered in CRM 3.0.**

    | # | Field Name | Action | Section/Form | Old value |
    |---|------------|--------|--------------|-----------|
    | 1 | `segments` | Added (Array) | Booking Model | `flightFrom`, `flightTo` (flat) |
    | 2 | `uniqueCode` | Reordered/Auto | Booking Model | Random string | Sequential `TW0001` format |
    | 3 | `contact` | Added (Embedded) | Booking Model | `primaryContactId` only | Snapshot of name/phone/type |
    | 4 | `followUpDate` | Reordered | Booking Form | Top-level | Integrated with status logic |

11. **Were any field types changed?**
   - `tripType`: Single value → Enum [`one-way`, `round-trip`, `multi-city`].
   - Travel Dates: Single fields → Part of `segments[]` array.

12. **Were any field validations added or modified?**
   - **IATA Normalization**: All airport codes are now forced to Uppercase on Save.
   - **Booking Schema**: Zod validation added for multi-city segment structure.

13. **Were any field default values changed?**
   - `assignedGroup`: Default set to `"Package / LCC"`.
   - `status`: Default set to `"Pending"`.

14. **Were any fields hidden or shown conditionally based on logic?**
   - **Multi-City Segments**: Leg fields (Leg 2, 3...) appear only when `tripType` is "multi-city".
   - **Return Date**: Hidden when `tripType` is "one-way".

15. **Do the field fixes involve database schema changes, or are they purely frontend?**
   - **DB Changes**: Major migration to `segments[]` array in MongoDB.
   - **Model**: `Booking.ts` refactored to include virtuals for legacy compatibility.

---

## SECTION 4 — Logic / Functionality

16. **Were any business logic changes made alongside the visual/field fixes?**
    - **Normalization Logic**: `masterMigrationV4.js` script used to backfill legacy data into segments.
    - **Initialization Logic**: Triple-layered fallback for dates in `BookingTravelers.tsx` to prevent empty fields.

17. **Were any API calls or data-fetching methods modified to support the field changes?**
    - `/api/sync`: Optimized for 100ms response time with database indexing.
    - `/api/sse`: Added for real-time push notifications.

18. **Were any event handlers (onClick, onChange, onSubmit) added or changed?**
    - `onSave`: Now includes automatic `toUpperCase()` for IATA codes.

---

## SECTION 5 — CRM Final — Known Differences

19. **What do you know is already different in CRM Final compared to CRM 3.0?**
    - [TBD - User needs to provide info on CRM Final's current state]

20. **Are there any fields or components in CRM Final that do NOT exist in CRM 3.0?**
    - [TBD]

21. **Are there any parts of CRM Final that should NOT be touched during this porting process?**
    - [TBD]

22. **Has CRM Final already had some of these fixes partially applied?**
    - [TBD]

---

## SECTION 6 — Files to Share

- [x] Modified files: `BookingDetails.tsx`, `BookingTravelers.tsx`, `Booking.ts`, `bookingController.ts`.
- [x] Global stylesheet: `index.css`.
- [x] Documentation: `DAILY_SUMMARY.md`, `02_FOLDER_STRUCTURE.md`.

---

## SECTION 7 — Priority & Constraints

23. **Which fixes are highest priority if not everything can be ported at once?**
    - 1. `segments[]` Data Schema (Normalization).
    - 2. `BookingTravelers` Data Persistence Fixes.
    - 3. SVG Flight Route Visualization.

24. **Is there a deadline or a specific order the fixes need to be applied in?**
    - Data schema (Backend/DB) must be ported before the Frontend can be updated.

25. **Should the porting be done manually by you, or do you need a script/automated diff to apply changes?**
    - Manual porting with automated verification via `verifyMigration.js` is recommended.
