# Conventions

## Coding Standards

### General
- **Language**: Strict TypeScript usage for both frontend and backend.
- **Naming**:
  - `camelCase` for variables, functions, and file names (except components).
  - `PascalCase` for React components and Mongoose models.
  - `UPPER_SNAKE_CASE` for environment variables and constants.
- **Project Structure**: Feature-based organization in the frontend; Layered architecture (Routes -> Controllers -> Models) in the backend.

### Frontend
- **Framework**: Functional components with Hooks.
- **Styling**: Tailwind CSS utility classes. Avoid inline styles.
- **Data Handling**: Use `react-query` for all server-state. Avoid manual `useEffect` for data fetching where possible.
- **Form Handling**: `react-hook-form` integrated with `zod` for validation.
- **Icons**: `lucide-react` for consistent iconography.

### Backend
- **Controllers**: Use `express-async-handler` for all route handlers.
- **Validation**: Use `zod` for request body and query validation.
- **Models**: Mongoose schemas with TypeScript interfaces.
- **Responses**: Standardized JSON responses (e.g., `{ success: true, data: ... }`).
- **Error Handling**: Use the centralized error handler middleware; avoid sending raw errors to the client in production.
- **Cache Invalidation**: Any controller mutating Booking/Settings collections MUST call the appropriate invalidation rules (`invalidateBookingCaches()` or `CacheInvalidation.onSettingsWrite()`) to avoid serving stale read queries.
- **Performance Profiling**: Wrap database-intensive operations in `createTimer` telemetry to maintain system monitoring visibility.

## Workflow
- **State Management**: Prefer local state or context for UI state; React Query for server state.
- **Commit History**: (Observed) Granular commits focused on specific fixes or features.
- **Real-time**: Prefer SSE for one-way updates (server-to-client); Socket.io reserved for bidirectional needs.
