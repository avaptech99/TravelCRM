# Server-Sent Events (SSE) Implementation Guide

This document explains how the real-time update system works in CRM 3.0.

## 1. Overview
Server-Sent Events (SSE) is a standard allowing servers to push data to web pages over HTTP. We chose SSE over WebSockets because:
- **Efficiency**: Lower overhead for server-to-client communication.
- **Resilience**: Native browser support for automatic reconnection.
- **Simplicity**: Works over standard HTTP/1.1 and is compatible with most proxies and load balancers (like Render's).

## 2. Backend Architecture

### `sseManager.ts`
The core registry for active connections.
- **Client Registry**: Uses a `Map` to store connections, keyed by `userId`. Supports multiple tabs per user.
- **Heartbeat**: Sends a `:heartbeat` comment every 30 seconds. This is critical for keeping connections alive on platforms like Render that terminate idle sockets.
- **Broadcasting**: 
  - `pushToUser(userId, event, data)`: Targets a specific user.
  - `pushToAll(event, data)`: Global broadcast.
  - `pushBookingEvent(event, data)`: Intelligent broadcast. It checks the booking's `assignedToUserId`, `createdByUserId`, and `assignedGroup` to notify only relevant users (or Admins).

### `sseRoutes.ts`
The entry point for clients.
- **Endpoint**: `GET /api/stream?token=...`
- **Authentication**: Validates the JWT from the query parameter (since `EventSource` doesn't support custom headers easily).
- **Headers**: Sets `Content-Type: text/event-stream` and `Cache-Control: no-cache`.

### `server.ts`
Integration with the Node.js lifecycle.
- **Initialization**: Starts the heartbeat interval within the worker process.
- **Graceful Shutdown**: Listens for `SIGTERM`/`SIGINT`. Before the server stops, it sends a `shutdown` event to all clients, allowing them to prepare for reconnection.

## 3. Frontend Architecture

### `useSSE.ts` Hook
A resilient React hook that manages the connection lifecycle.
- **Singleton Connection**: Designed to be called once in `MainLayout.tsx` to maintain a single `EventSource` per tab.
- **Event Mapping**: Translates server events into **React Query** actions:
  - `invalidateQueries`: Forces a fresh fetch (used for complex changes).
  - `setQueryData`: Performs an "Optimistic UI" style patch (used for instant status updates or deleting items from a list).
- **Polling Fallback**: If the SSE connection fails 3 times consecutively, the hook automatically switches the app to **20s polling mode**. It continues to attempt SSE reconnection in the background every 2 minutes.

### Visual Indicator
Located in the sidebar, this shows the system health:
- 🟢 **Live System**: Connected via SSE.
- 🟡 **Syncing**: Falling back to polling.
- 🔴 **Disabled**: Connection lost.

## 4. Standard Event Flow
1. **Action**: An agent updates a booking status in `bookingController.ts`.
2. **Push**: The controller calls `pushBookingEvent('status_changed', { ... })`.
3. **Transmission**: `sseManager` identifies all agents/admins who should see this booking and pushes the JSON payload.
4. **Reception**: The `useSSE` hook in other agents' browsers receives the event.
5. **Update**: `useSSE` calls `queryClient.setQueryData` to update the specific booking in the cache.
6. **UI Change**: React detects the cache change and re-renders the specific table row instantly, without a page refresh.

## 5. Maintenance & Troubleshooting
- **Memory**: Since connections are stored in memory, ensure `WEB_CONCURRENCY` is set to `1` on free-tier servers. If scaling horizontally, a Redis Pub/Sub layer will be needed to sync events across workers.
- **Timeouts**: If you see "Syncing" frequently, check if the server is restarting or if the 30s heartbeat is being blocked by long-running synchronous tasks.
