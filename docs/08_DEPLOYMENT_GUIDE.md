# 🚀 Deployment Guide

> How to set up, run locally, and deploy this project.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Running Locally](#3-running-locally)
4. [Deploying the Backend (Render)](#4-deploying-the-backend-render)
5. [Deploying the Frontend (Vercel)](#5-deploying-the-frontend-vercel)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Database Setup (MongoDB Atlas)](#7-database-setup-mongodb-atlas)
8. [WordPress Integration Setup](#8-wordpress-integration-setup)
9. [Troubleshooting Deployment](#9-troubleshooting-deployment)

---

## 1. Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Git**
- **MongoDB Atlas** account (free tier works)
- **Vercel** account (for frontend deployment)
- **Render** account (for backend deployment)

---

## 2. Local Development Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd CRM
```

### Step 2: Install Dependencies
```bash
# Root dependencies (concurrently)
npm install

# Backend dependencies
cd travel-crm-backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

### Step 3: Configure Backend Environment
```bash
cd travel-crm-backend
cp .env.example .env
```

Edit `.env` with your actual values:
```env
PORT=5000
MONGODB_URI="mongodb+srv://your-user:your-pass@your-cluster.mongodb.net/travel-crm"
JWT_SECRET="your-random-secret-key-minimum-32-chars"
BASE_URL="http://localhost:5000"
EXTERNAL_API_KEY="crm-wp-integration-2026"
```

### Step 4: Seed the Database (First Time Only)
```bash
cd travel-crm-backend
npm run seed
```
This creates:
- Admin: `admin@travel.com` / `admin123`
- Agent: `agent@travel.com` / `agent123`

> Note: If you skip this step, the server auto-creates just the admin account when the DB is empty.

---

## 3. Running Locally

### Option A: Run Both Together (Recommended)
From the root directory:
```bash
npm run dev
```
This starts both backend (port 5000) and frontend (port 5173) simultaneously using `concurrently`.

### Option B: Run Separately
**Backend:**
```bash
cd travel-crm-backend
npm run dev
```
Runs on `http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173`

### Open the App
Go to `http://localhost:5173` in your browser.

---

## 4. Deploying the Backend (Render)

### Step 1: Create a New Web Service on Render

1. Go to [https://render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repo

### Step 2: Configure Build Settings

| Setting | Value |
|---|---|
| **Root Directory** | `travel-crm-backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Runtime** | Node |

> ⚠️ The root directory MUST be set to `travel-crm-backend`, not the repo root.

### Step 3: Set Environment Variables

In Render's dashboard, add these environment variables:

| Key | Value |
|---|---|
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas connection string) |
| `JWT_SECRET` | `your-random-secret-key` |
| `BASE_URL` | `https://your-service-name.onrender.com` |
| `EXTERNAL_API_KEY` | `crm-wp-integration-2026` |
| `NODE_ENV` | `production` |

### Step 4: Deploy
Render auto-deploys on push to main branch. First deploy takes a few minutes.

### Free Tier Notes
- Server sleeps after 15 minutes of inactivity
- Cold starts take 30-60 seconds
- The `keepWarm.ts` utility self-pings every 10 minutes to prevent sleep
- Consider an external pinger like [cron-job.org](https://cron-job.org) for additional reliability

---

## 5. Deploying the Frontend (Vercel)

### Step 1: Import Project on Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repo

### Step 2: Configure Build Settings

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 3: Set Environment Variables

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

> ⚠️ Must start with `VITE_` for Vite to expose it to the frontend.

### Step 4: Deploy
Vercel auto-deploys on push. The `vercel.json` handles:
- SPA rewrites (all routes → `index.html`)
- Static asset caching (1 year immutable for `/assets/*`)

---

## 6. Environment Variables Reference

### Backend `.env`

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `PORT` | No | `5000` | Server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `DATABASE_URL` | No | — | Alternative to MONGODB_URI |
| `JWT_SECRET` | **Yes** | `fallback-secret-for-dev` | Secret for JWT signing |
| `BASE_URL` | No | — | Full URL of the backend (enables self-ping) |
| `EXTERNAL_API_KEY` | No | — | API key for WordPress integration |
| `NODE_ENV` | No | `development` | Set to `production` for prod |

### Frontend Environment

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Backend API base URL |

---

## 7. Database Setup (MongoDB Atlas)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user with read/write access
4. Add `0.0.0.0/0` to Network Access (or specific Render IPs)
5. Get the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database-name>
   ```
6. Use this as your `MONGODB_URI`

### Recommended Database Name: `travel-crm`

### No Manual Schema Setup Needed
Mongoose creates collections and indexes automatically when the app first runs.

---

## 8. WordPress Integration Setup

### On WordPress Side

1. Open your theme's `functions.php` or use a custom plugin
2. Add the PHP script from `wordpress_integration_all data.php`
3. Update the endpoint URL to point to your backend:
   ```php
   $api_url = 'https://your-backend.onrender.com/api/external/lead';
   ```
4. Update the API key to match your `EXTERNAL_API_KEY` env var:
   ```php
   $api_key = 'crm-wp-integration-2026';
   ```
5. The script hooks into `ninja_forms_after_submission`

### On CRM Side

1. Set `EXTERNAL_API_KEY` in your backend `.env`
2. Deploy the backend
3. Test by submitting a form on your WordPress site
4. Check the CRM dashboard — a new lead should appear

---

## 9. Troubleshooting Deployment

### Build Fails on Vercel
- Check that **Root Directory** is set to `frontend`
- Ensure `VITE_API_URL` is set correctly (with `/api` suffix)
- Check the build logs for TypeScript errors

### Build Fails on Render
- Check that **Root Directory** is set to `travel-crm-backend`
- Ensure `MONGODB_URI` is set
- If bcrypt build fails, try using `bcryptjs` instead of `bcrypt`

### Backend Returns 500 Errors
- Check Render logs for errors
- Verify `MONGODB_URI` is correct and Atlas allows the IP
- Verify `JWT_SECRET` is set

### Frontend Shows White Screen
- Check browser console for errors
- Verify `VITE_API_URL` points to the correct backend
- Check if the backend is actually running (hit `/health`)

### CORS Errors
- The backend currently allows all origins — this shouldn't be an issue
- If locked down, add your Vercel domain to the CORS config in `server.ts`

### "Blocked" Deployment on Vercel
- Usually caused by TypeScript type errors
- Run `npm run build` locally first to check for errors
- Fix all type errors before pushing

### Database Connection Issues
- Check MongoDB Atlas dashboard for connection limits
- Free tier allows max 500 connections
- The backend uses `maxPoolSize: 5` to stay within limits
- Make sure `0.0.0.0/0` is in Atlas Network Access list

---

## NPM Scripts Reference

### Root (`/`)
| Command | Action |
|---|---|
| `npm run dev` | Start both frontend + backend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build backend |
| `npm start` | Start backend in production mode |
| `npm run seed` | Seed database with demo accounts |

### Backend (`/travel-crm-backend/`)
| Command | Action |
|---|---|
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to JS |
| `npm start` | Run compiled JS from `dist/` |
| `npm run seed` | Run database seeder |
| `npm run migrate` | Run data migration script |

### Frontend (`/frontend/`)
| Command | Action |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
