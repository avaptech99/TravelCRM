# Tech Stack

## Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI, Lucide React
- **Styling**: Tailwind CSS 4.0, CSS Variables
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Routing**: React Router 7 (React Router DOM)
- **Notifications**: Sonner, React Hot Toast
- **API Client**: Axios

## Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Caching**: Centralized `node-cache` engine with automatic warmup routines
- **Performance Telemetry**: Custom execution duration timer (`perfLogger`)
- **Real-time**: Server-Sent Events (SSE), Socket.io (stubbed)
- **Validation**: Zod
- **Authentication**: JWT, Bcrypt
- **Process Management**: Node Cluster (Primary/Worker model)
- **Logging**: Morgan
- **Middleware**: compression, cors, morgan, express-async-handler

## Infrastructure & Tools
- **Monorepo Manager**: Root package.json with `concurrently`
- **Deployment**: Vercel (Frontend/Monorepo config), Railway (Backend mention)
- **Task Runner**: npm scripts
- **Environment**: dotenv
