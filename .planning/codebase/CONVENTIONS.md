# Coding Conventions

This document outlines the coding standards and patterns followed throughout the Travel CRM.

## 🛠️ Language & Typing
- **TypeScript**: Used extensively across both frontend and backend for type safety.
- **Strict Typing**: Prefer interfaces and explicit types over `any`.
- **Zod**: Used for both schema validation (backend) and form validation (frontend).

## 🎨 UI & Styling
- **Utility-First CSS**: Using **Tailwind CSS 4** for all styling.
- **Radix UI**: Primitive components for accessible UI elements (Dialogs, Dropdowns).
- **Lucide React**: Standardization of icons for visual consistency.
- **Responsive Design**: Mobile-first approach using Tailwind's responsive prefixes.

## ⚛️ React Patterns
- **Functional Components**: All frontend components use React's functional pattern with hooks.
- **Custom Hooks**: Encapsulate complex logic (data fetching, state sync) in hooks within the `hooks/` directory.
- **Feature-Based Module**: Larger functionalities are grouped within the `features/` directory for better maintainability.

## 📡 Networking
- **Axios**: Standardized HTTP client for API communication.
- **TanStack Query**: Manages server state, caching, and background data fetching.
- **Error Handling**: Standardized error response handling on both client and server.

## ⚙️ Backend Patterns
- **Async Handling**: All Express routes use `express-async-handler` to prevent unhandled promise rejections.
- **Mongoose Schemas**: Centralized models for data persistence.
- **Middleware Chain**: Use of middleware for authentication, logging, and error processing.
