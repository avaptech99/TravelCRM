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

                // Verify token
                const decoded = verifyToken(token);

                // Check if user still exists
                const user = await User.findById(decoded.id).select('role');

                if (!user) {
                    res.status(401);
                    throw new Error('Not authorized, user not found');
                }

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
