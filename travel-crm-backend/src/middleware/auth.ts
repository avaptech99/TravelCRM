import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyToken, JwtPayload } from '../utils/jwt';
import User from '../models/User';

// Extend the Express Request type to include the user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Throttle lastSeen updates: max once per 60s per user (in-memory)
const lastSeenCache = new Map<string, number>();
const LAST_SEEN_THROTTLE = 60 * 1000; // 60 seconds

const touchLastSeen = (userId: string) => {
    const now = Date.now();
    const lastTouch = lastSeenCache.get(userId) || 0;
    if (now - lastTouch > LAST_SEEN_THROTTLE) {
        lastSeenCache.set(userId, now);
        // Fire-and-forget — don't await, don't block the request
        User.updateOne({ _id: userId }, { $set: { lastSeen: new Date() } }).exec().catch(() => {});
    }
};

export const protect = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            try {
                // Get token from header
                token = req.headers.authorization.split(' ')[1];

                // Verify token — JWT already contains id, name, role
                // No DB lookup needed (saves ~50-100ms per request)
                const decoded = verifyToken(token);

                // Attach user to request
                req.user = decoded;

                // Passively keep lastSeen fresh (throttled, non-blocking)
                touchLastSeen(decoded.id);

                next();
            } catch (error) {
                res.status(401);
                throw new Error('Not authorized, token failed');
            }
        }

        if (!token) {
            res.status(401);
            throw new Error('Not authorized, no token');
        }
    }
);

export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};
