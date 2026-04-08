# Technology Stack

This document outlines the core technologies and libraries used across the Travel CRM monorepo.

## Core Frameworks & Environments
- **Frontend**: Vite + React 19 + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (via Mongoose)
- **Monorepo Management**: Root-level orchestration with `concurrently` for development scripts

## Frontend Dependencies
- **Styling**: Tailwind CSS 4 (Beta/Latest), Lucide React (Icons), Radix UI (Primitives)
- **State & Data Fetching**: TanStack Query (React Query), Axios
- **Form Management**: React Hook Form, @hookform/resolvers, Zod
- **Routing**: React Router DOM (v7)
- **Visualization**: Recharts
- **Utilities**: Day.js, clsx, tailwind-merge, sonner (Toasts)

## Backend Dependencies
- **Core**: Express.js, express-async-handler
- **Database**: Mongoose (v9.2+)
- **Real-time**: Socket.io
- **Security & Auth**: JSON Web Tokens (jsonwebtoken), bcrypt
- **Language Processing**: chrono-node, compromise (for AI travel info extraction)
- **Utilities**: Morgan (Logging), Cors, Compression, Dotenv, node-fetch

## Development Tools
- **Build System**: Vite (Frontend), TSC (Backend)
- **Linters/Formatters**: ESLint
- **Language**: TypeScript 6
- **Dev Servers**: Vite (Frontend), ts-node-dev (Backend)
