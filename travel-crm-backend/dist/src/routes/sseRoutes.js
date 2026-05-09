"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sseManager_1 = require("../sse/sseManager");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── GET /api/stream — SSE connection endpoint ─────────────────────────────────
router.get('/', async (req, res) => {
    // ── Auth via query-string token ────────────────────────────────────────────
    // Browser EventSource API cannot send custom headers.
    // Token is passed as: /api/stream?token=xxx
    const token = req.query.token;
    if (!token) {
        return res.status(401).json({ message: 'Token required' });
    }
    let user;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        user = {
            id: decoded.id || decoded._id,
            role: decoded.role,
            name: decoded.name,
            groups: decoded.groups || [],
        };
    }
    catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    // ── SSE headers ───────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disables Nginx/Render buffering
    res.flushHeaders(); // send headers immediately — client knows connection is open
    // ── Register ──────────────────────────────────────────────────────────────
    (0, sseManager_1.registerSSEClient)(user.id, user.role, user.groups, res);
    // ── Send initial connected event ──────────────────────────────────────────
    res.write(`event: connected\ndata: ${JSON.stringify({
        userId: user.id,
        role: user.role,
        message: 'SSE connection established',
        timestamp: Date.now(),
    })}\n\n`);
    // ── Cleanup on disconnect ─────────────────────────────────────────────────
    req.on('close', () => {
        (0, sseManager_1.removeSSEClient)(user.id);
    });
    req.on('error', () => {
        (0, sseManager_1.removeSSEClient)(user.id);
    });
    // Note: do NOT call res.end() — connection stays open
});
// ── GET /api/stream/status — monitoring ──────────────────────────────────────
router.get('/status', auth_1.protect, (req, res) => {
    if (req.user.role.toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin only' });
    }
    res.json((0, sseManager_1.getSSEStats)());
});
exports.default = router;
