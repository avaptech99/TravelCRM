# Structure

## Directory Map

```text
CRM 3.0/
├── frontend/                # React Frontend (Vite)
│   ├── src/
│   │   ├── api/             # Axios client and API definitions
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # React Context (Auth, etc.)
│   │   ├── features/        # Feature-specific logic and components
│   │   ├── hooks/           # Custom React hooks (useSSE, etc.)
│   │   ├── pages/           # Page-level components
│   │   ├── types/           # TypeScript interfaces/types
│   │   └── utils/           # Helper functions
│   └── public/              # Static assets
├── travel-crm-backend/      # Express Backend
│   ├── src/
│   │   ├── config/          # DB and system configuration
│   │   ├── controllers/     # Business logic (auth, bookings, settings, analytics)
│   │   ├── middleware/      # Auth, logging, performance, and error handlers
│   │   ├── models/          # Mongoose schemas (Booking, Setting, User, User, Payment)
│   │   ├── routes/          # API endpoint definitions
│   │   ├── sse/             # SSE stream management
│   │   ├── utils/           # Helpers (Cron, Cache, PerfLogger, Password)
│   │   └── server.ts        # Entry point
├── migration script/        # Data migration utilities
├── docs/                    # Project documentation
└── package.json             # Monorepo root configuration
```

## Key Files
- `package.json` (Root): Orchestrates the monorepo scripts.
- `travel-crm-backend/src/server.ts`: Backend entry point with clustering and DB connection.
- `travel-crm-backend/src/models/Setting.ts`: Database schema for dynamic, admin-managed dropdown configuration.
- `travel-crm-backend/src/controllers/settingsController.ts`: Dropdown management logic with caching integrations.
- `travel-crm-backend/src/utils/cache.ts`: NodeCache implementation for endpoint optimization.
- `travel-crm-backend/src/utils/perfLogger.ts`: Timing execution engine to log and check query health.
- `frontend/src/api/client.ts`: Centralized API client for the frontend.
- `travel-crm-backend/src/sse/sseManager.ts`: Core real-time logic.
- `vercel.json`: Configuration for frontend deployment.
