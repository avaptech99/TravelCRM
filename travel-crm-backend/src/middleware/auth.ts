import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend the Express Request type to include the user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

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
