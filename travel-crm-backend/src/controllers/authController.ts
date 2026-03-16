import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import { loginSchema } from '../types';
import { matchPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const { email, password } = result.data;

    // Find user by email - use lean() for performance and select only needed fields
    const dbStartTime = Date.now();
    const user = await User.findOne({ email })
        .select('passwordHash name email role')
        .lean();
    const dbEndTime = Date.now();

    // Verify user exists and password matches
    if (user) {
        const bcryptStartTime = Date.now();
        const isMatch = await matchPassword(password, user.passwordHash);
        const bcryptEndTime = Date.now();

        if (isMatch) {
            const totalTime = Date.now() - startTime;
            console.log(`[LOGIN PERF] Total: ${totalTime}ms | DB: ${dbEndTime - dbStartTime}ms | Bcrypt: ${bcryptEndTime - bcryptStartTime}ms`);

            // Update user's online status
            await User.findByIdAndUpdate(user._id, {
                isOnline: true,
                lastSeen: new Date()
            });

            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOnline: true,
                token: generateToken(user),
            });
            return;
        }
    }

    res.status(401);
    throw new Error('Invalid email or password');
});
