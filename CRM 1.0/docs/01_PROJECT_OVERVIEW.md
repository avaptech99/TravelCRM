# 📋 Travel CRM — Project Overview

> **Last Updated:** April 2026  
> **Original Author:** Anmol  
> **Status:** Production (Live)

---

## What Is This Project?

This is a **full-stack CRM (Customer Relationship Management) system** built for a travel agency called **Travel Window**. It helps the agency manage flight bookings, track leads from their website, assign work to agents, record payments, and generate reports.

### Who Uses It?

| Role | What They Do |
|---|---|
| **ADMIN** | Full access. Manages users, assigns bookings, views reports and analytics. |
| **AGENT** | Works on assigned bookings — adds travelers, records payments, updates status. |
| **MARKETER** | Creates leads (bookings), adds requirements. Cannot modify once assigned. Limited view. |

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + TypeScript | React 19, TypeScript 6 |
| **Build Tool** | Vite | v8 |
| **Styling** | Tailwind CSS | v4 |
| **State/Cache** | TanStack Query (React Query) | v5 |
| **Table** | TanStack Table | v8 |
| **Forms** | React Hook Form + Zod | v7 / v4 |
| **Backend** | Node.js + Express (TypeScript) | Express 4, TS 6 |
| **Database** | MongoDB (Atlas) | Mongoose v9 |
| **NLP** | chrono-node + compromise | — |
| **Auth** | JWT (jsonwebtoken) + bcrypt | — |
| **Deployment** | Frontend: Vercel, Backend: Render | Free Tier |

---

## Architecture Diagram

```
┌─────────────────────────┐      ┌─────────────────────────┐
│    FRONTEND (Vercel)    │      │   WordPress Website     │
│    React + Vite + TS    │      │   (Ninja Forms)         │
│    Port: 5173 (dev)     │      │                         │
└──────────┬──────────────┘      └──────────┬──────────────┘
           │                                │
           │ Axios HTTP                     │ PHP cURL
           │ (Bearer JWT Token)             │ (X-API-KEY Header)
           ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Render)                           │
│              Node.js + Express + TypeScript              │
│              Port: 5000                                  │
│                                                         │
│  /api/auth       → Login, Seed                          │
│  /api/bookings   → CRUD, Passengers, Payments, Calendar │
│  /api/users      → User Management                      │
│  /api/analytics  → Reports & Charts                     │
│  /api/sync       → Dashboard polling (single endpoint)  │
│  /api/notifications → User notifications                │
│  /api/external   → WordPress lead intake                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Mongoose ODM
                       ▼
              ┌──────────────────┐
              │  MongoDB Atlas   │
              │  (Free Tier)     │
              └──────────────────┘
```

---

## How Data Flows

1. **User logs in** → Frontend sends email/password to `/api/auth/login` → Backend returns JWT token → Stored in `localStorage`.
2. **Dashboard loads** → Frontend polls `/api/sync` every 20 seconds → Returns stats, recent bookings, and notifications in one call (saves API requests).
3. **New booking created** → Frontend sends form data to `POST /api/bookings` → Backend creates a `PrimaryContact` + `Booking` → NLP extracts travel info from requirements text.
4. **WordPress form submitted** → PHP script sends all form fields to `POST /api/external/lead` with API key → Backend parses fields, creates PrimaryContact + Booking automatically.
5. **Agent works on booking** → Updates status, adds passengers/travelers, records payments → Each action invalidates the in-memory cache.

---

## Key Design Decisions

1. **PrimaryContact ↔ Booking Separation**: Contact person info (name, phone, email, requirements) is stored in a separate `PrimaryContact` collection. The `Booking` stores trip-specific data. They are linked via `primaryContactId`.

2. **In-Memory Caching**: The backend uses a custom `MemoryCache` class (no Redis) to avoid cold-start costs on free-tier hosting. Cache TTLs are short (30-120 seconds) and invalidated on writes.

3. **Consolidated Sync Endpoint**: Instead of the dashboard making 4+ API calls, a single `/api/sync` endpoint returns stats + recent bookings + notifications in one response.

4. **NLP Extraction**: When a booking is created with a "Requirements" text, the system uses chrono-node (dates) and compromise (places) to auto-populate destination, travel date, and traveler count.

5. **Sequential Booking Codes**: Each booking gets a unique code like `TW0001`, `TW0002`, etc. via a `Counter` model that auto-increments.

6. **Role-Based Access**: Permissions are enforced at both the frontend (UI hiding) and backend (middleware guards). The `protect` middleware validates JWT on every request. The `adminGuard` middleware checks for ADMIN role.

---

## Deployment Info

| Service | Platform | URL Pattern |
|---|---|---|
| Frontend | Vercel | `*.vercel.app` |
| Backend | Render | `*.onrender.com` |
| Database | MongoDB Atlas | Cloud-hosted |

### Environment Variables

**Backend** (`.env` in `travel-crm-backend/`):
```
PORT=5000
MONGODB_URI="mongodb+srv://..."
JWT_SECRET="your-secret-key"
BASE_URL="https://your-backend.onrender.com"
EXTERNAL_API_KEY="crm-wp-integration-2026"
```

**Frontend** (set in Vercel dashboard or `.env` in `frontend/`):
```
VITE_API_URL="https://your-backend.onrender.com/api"
```

---

## Default Login Credentials

The system auto-seeds an admin account if the database is empty:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@travel.com` | `admin123` |
| Agent | `agent@travel.com` | `agent123` |

> ⚠️ **Change these immediately in production!**
