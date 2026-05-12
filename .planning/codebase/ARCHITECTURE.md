# Architecture

## System Overview
The Travel CRM is a full-stack web application built on a client-server architecture, organized as a monorepo for easier management and deployment.

## Design Patterns

### Backend (Express + Mongoose)
- **Controller-Route Pattern**: Standard Express routing mapping to controller functions.
- **Async Error Handling**: Uses `express-async-handler` to simplify try-catch blocks in controllers.
- **Model-View-Controller (MVC)**:
  - **Models**: Mongoose schemas in `src/models`.
  - **Controllers**: Business logic in `src/controllers`.
  - **Routes**: API endpoint definitions in `src/routes`.
- **Clustering**: Uses the Node `cluster` module to fork worker processes, maximizing multicore performance.
- **SSE/Real-time**: Custom SSE implementation for low-latency notifications without the overhead of full WebSockets.

### Frontend (React + Vite)
- **Component-Based UI**: Modular React components styled with Tailwind CSS.
- **Feature-Based Structure**: Code organized into functional features (observed in `src/features`).
- **Data Fetching**: TanStack Query for caching, optimistic updates, and background synchronization.
- **Interceptors**: Axios interceptors for centralized auth (Bearer tokens) and error handling (401 redirects).

## Data Flow
1. **Request**: Frontend makes a request via Axios (Central client).
2. **Auth**: Backend middleware validates the JWT.
3. **Business Logic**: Controller processes data, interacting with Mongoose models.
4. **Real-time Update**: For critical actions (e.g., new lead), backend triggers SSE events via `sseManager`.
5. **Response**: JSON response returned to frontend.
6. **UI Sync**: TanStack Query invalidates relevant keys, triggering UI refreshes.

## Deployment Strategy
- **Frontend**: Likely Vercel (based on `vercel.json`).
- **Backend**: Likely Railway or similar (based on code comments and cluster configuration).
- **Environment**: Managed via `.env` files with cross-environment consistency.
