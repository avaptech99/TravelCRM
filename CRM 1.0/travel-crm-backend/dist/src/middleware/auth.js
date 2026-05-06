"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGuard = exports.protect = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
// Throttle lastSeen updates: max once per 60s per user (in-memory)
const lastSeenCache = new Map();
const LAST_SEEN_THROTTLE = 60 * 1000; // 60 seconds
const touchLastSeen = (userId) => {
    const now = Date.now();
    const lastTouch = lastSeenCache.get(userId) || 0;
    if (now - lastTouch > LAST_SEEN_THROTTLE) {
        lastSeenCache.set(userId, now);
        // Fire-and-forget — don't await, don't block the request
        User_1.default.updateOne({ _id: userId }, { $set: { lastSeen: new Date() } }).exec().catch(() => { });
    }
};
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token — JWT already contains id, name, role
            // No DB lookup needed (saves ~50-100ms per request)
            const decoded = (0, jwt_1.verifyToken)(token);
            // Attach user to request
            req.user = decoded;
            // Passively keep lastSeen fresh (throttled, non-blocking)
            touchLastSeen(decoded.id);
            next();
        }
        catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});
const adminGuard = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};
exports.adminGuard = adminGuard;
