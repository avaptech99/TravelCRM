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
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, logging, and error handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoint definitions
│   │   ├── sse/             # SSE stream management
│   │   ├── utils/           # Helpers (Cron, Cache, etc.)
│   │   └── server.ts        # Entry point
├── migration script/        # Data migration utilities
├── docs/                    # Project documentation
└── package.json             # Monorepo root configuration
```

## Key Files
- `package.json` (Root): Orchestrates the monorepo scripts.
- `travel-crm-backend/src/server.ts`: Backend entry point with clustering and DB connection.
- `frontend/src/api/client.ts`: Centralized API client for the frontend.
- `travel-crm-backend/src/sse/sseManager.ts`: Core real-time logic.
- `vercel.json`: Configuration for frontend deployment.
