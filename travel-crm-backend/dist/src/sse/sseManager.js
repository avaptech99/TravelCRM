"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSSEClient = registerSSEClient;
exports.removeSSEClient = removeSSEClient;
exports.pushToUser = pushToUser;
exports.pushToAll = pushToAll;
exports.pushBookingEvent = pushBookingEvent;
exports.getSSEStats = getSSEStats;
exports.startSSEHeartbeat = startSSEHeartbeat;
exports.stopSSEHeartbeat = stopSSEHeartbeat;
exports.shutdownSSE = shutdownSSE;
// ─── Client registry ─────────────────────────────────────────────────────────
// Map of userId → SSEClient
// One connection per user — new connection replaces old (handles tab refresh)
//
// ⚠️ CLUSTER WARNING: This Map lives in worker memory.
// If WEB_CONCURRENCY > 1, push events may miss users on other workers.
// Keep WEB_CONCURRENCY=1 on Render, or add Redis pub/sub for multi-worker.
const clients = new Map();
let heartbeatTimer = null;
// ─── Register a new SSE client ────────────────────────────────────────────────
function registerSSEClient(userId, role, groups, res) {
    // Close existing connection for this user (tab refresh / new login)
    const existing = clients.get(userId);
    if (existing) {
        try {
            existing.res.write('event: replaced\ndata: {}\n\n');
            existing.res.end();
        }
        catch { /* already closed */ }
        console.log(`[SSE] Replaced existing connection for ${userId}`);
    }
    clients.set(userId, { res, userId, role, groups, connectedAt: Date.now() });
    console.log(`[SSE] Connected: ${userId} (${role}) | Total: ${clients.size}`);
}
// ─── Remove a client ──────────────────────────────────────────────────────────
function removeSSEClient(userId) {
    clients.delete(userId);
    console.log(`[SSE] Disconnected: ${userId} | Remaining: ${clients.size}`);
}
// ─── Push to a specific user ──────────────────────────────────────────────────
function pushToUser(userId, event, data) {
    const client = clients.get(userId);
    if (!client)
        return false;
    return safePush(client, event, data);
}
// ─── Push to ALL connected users ──────────────────────────────────────────────
function pushToAll(event, data) {
    let sent = 0;
    clients.forEach(client => {
        if (safePush(client, event, data))
            sent++;
    });
    return sent;
}
// ─── Push to users who can see a specific booking ─────────────────────────────
// Mirrors role-based visibility logic:
//   ADMIN    → sees all
//   AGENT    → sees assigned or group bookings
//   MARKETER → sees bookings they created
function pushBookingEvent(event, data) {
    clients.forEach(client => {
        const { role, groups, userId } = client;
        const roleLower = role.toLowerCase();
        if (roleLower === 'admin') {
            safePush(client, event, data);
            return;
        }
        if (roleLower === 'agent' || roleLower === 'manager' || roleLower === 'visa' || roleLower === 'ticketing') {
            const isAssigned = data.assignedToUserId === userId;
            const isInGroup = data.assignedGroup && groups.includes(data.assignedGroup);
            if (isAssigned || isInGroup) {
                safePush(client, event, data);
            }
            return;
        }
        if (roleLower === 'marketer') {
            if (data.createdByUserId === userId) {
                safePush(client, event, data);
            }
            return;
        }
        if (roleLower === 'operation' || roleLower === 'account') {
            // These roles usually see only 'Booked' status bookings, but for SSE updates
            // we'll push if it's relevant to what they can see.
            // Simplification: if it's 'Booked' status, they might be interested.
            if (data.status === 'Booked') {
                safePush(client, event, data);
            }
            return;
        }
        // fallback — push to everyone if role not specifically handled
        safePush(client, event, data);
    });
}
// ─── Stats for monitoring ─────────────────────────────────────────────────────
function getSSEStats() {
    return {
        connected: clients.size,
        clients: Array.from(clients.values()).map(c => ({
            userId: c.userId,
            role: c.role,
            uptime: Math.round((Date.now() - c.connectedAt) / 1000) + 's',
        })),
    };
}
// ─── Heartbeat — keeps Render connections alive ───────────────────────────────
// Render free tier closes idle HTTP connections after ~55s
// Heartbeat every 30s prevents this
function startSSEHeartbeat() {
    if (heartbeatTimer)
        return; // already started
    heartbeatTimer = setInterval(() => {
        if (clients.size === 0)
            return;
        const dead = [];
        clients.forEach((client, userId) => {
            const ok = safePush(client, 'heartbeat', { ts: Date.now() });
            if (!ok)
                dead.push(userId);
        });
        // Clean up connections that errored on heartbeat
        dead.forEach(userId => {
            clients.delete(userId);
            console.log(`[SSE] Removed dead connection: ${userId}`);
        });
        if (clients.size > 0) {
            console.log(`[SSE] Heartbeat: ${clients.size} active connections`);
        }
    }, 30_000); // every 30s
    console.log('[SSE] Heartbeat started (30s interval)');
}
function stopSSEHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}
// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdownSSE() {
    stopSSEHeartbeat();
    clients.forEach((client, userId) => {
        try {
            client.res.write('event: shutdown\ndata: {}\n\n');
            client.res.end();
        }
        catch { /* ignore */ }
    });
    clients.clear();
    console.log('[SSE] All connections closed');
}
// ─── Internal ─────────────────────────────────────────────────────────────────
function safePush(client, event, data) {
    try {
        const payload = JSON.stringify({ ...data, _ts: Date.now() });
        client.res.write(`event: ${event}\ndata: ${payload}\n\n`);
        return true;
    }
    catch (err) {
        // Connection was closed — remove client
        clients.delete(client.userId);
        console.log(`[SSE] Removed broken connection: ${client.userId}`);
        return false;
    }
}
