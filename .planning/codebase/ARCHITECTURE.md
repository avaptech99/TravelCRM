# Project Architecture

This document describes the high-level architecture of the Travel CRM system.

## 🏗️ System Overview
The Travel CRM is a full-stack, monorepo application using a **Client-Server** model.
- **Client**: A modern React-based Single Page Application (SPA).
- **Server**: A Node.js/Express RESTful API with real-time capabilities via WebSockets.

## 📁 Monorepo Strategy
The project uses a simple monorepo structure where both the frontend and backend reside in the same repository.
- Root orchestration is handled by `package.json` scripts using **Concurrently** to run development servers for both tiers simultaneously.

## 🛣️ API Design
- **RESTful Endpoints**: The backend exposes standard REST routes for managing bookings, users, and customers.
- **JSON Payload**: All request and response bodies use JSON.
- **Stateless Auth**: Security is managed via JWT (JSON Web Tokens) passed in the `Authorization` header.

## 📡 Real-time Synchronization
The system incorporates **Socket.io** for real-time updates.
- When a booking's status changes or a new payment is recorded, the server broadcasts an event to all connected clients.
- This ensures dashboard views stay in sync without manual refreshes.

## 🗄️ Persistence Layer
- **NoSQL Schema**: Use MongoDB for its flexibility with varying travel requirement data.
- **ODM**: Mongoose provides schema validation and an object-oriented interface for the database.
- **AI Extraction**: An internal utility parses free-form "Requirements" text into structured booking fields upon save/update.
