# Directory Structure

This document provides a breakdown of the file and directory layout across the monorepo.

## 📂 Root Directory
- `frontend/`: React SPA source and configuration.
- `travel-crm-backend/`: Node.js Express server source and configuration.
- `docs/`: Project documentation and guides (overview, structure, etc.).
- `wordpress_integration_*.php`: Integration scripts for WordPress connectivity.

## 🖥️ Frontend Structure (`frontend/src/`)
- `api/`: Axios instances and API service definitions.
- `components/`: Shared UI components (Radix, Lucide, Recharts).
- `features/`: Complex, cross-page functional modules (e.g., Bookings, Analytics).
- `pages/`: Page-level components corresponding to application routes.
- `hooks/`: Custom React hooks for data fetching and state logic.
- `context/`: React Context providers for global state (Auth, Theme).
- `types/`: TypeScript interfaces and type definitions.
- `lib/`: Configuration for external libraries (Tailwind, Radix).
- `utils/`: Common utility functions.

## ⚙️ Backend Structure (`travel-crm-backend/src/`)
- `controllers/`: Handles incoming requests and business logic.
- `models/`: Mongoose schemas for MongoDB entities (Booking, User, Customer).
- `routes/`: Express router definitions for API endpoints.
- `middleware/`: Custom middleware (Auth, Error handling, Logging).
- `config/`: Configuration for database, environment, and services.
- `utils/`: Helper utilities (AI extraction, date parsing).
- `socket.ts`: Socket.io initialization and event handling logic.
- `server.ts`: Application entry point.

## 📝 Documentation (`docs/`)
- `01_PROJECT_OVERVIEW.md`: High-level summary.
- `02_FOLDER_STRUCTURE.md`: Detailed structural documentation.
- `03_BACKEND_GUIDE.md`: Developer guide for server-side work.
- `04_FRONTEND_GUIDE.md`: Developer guide for client-side work.
- `05_API_REFERENCE.md`: List of endpoints and payloads.
- `06_DATABASE_SCHEMA.md`: MongoDB schema details.
