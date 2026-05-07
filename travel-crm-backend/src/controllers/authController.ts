import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import { loginSchema } from '../types';
import { matchPassword, needsUpgrade, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { createTimer } from '../utils/perfLogger';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const t = createTimer('loginUser');
    const result = loginSchema.safeParse(req.body);
    t.mark('validate');

    if (!result.success) {
        t.end({ error: 'Invalid input' });
        res.status(400);
        throw new Error('Invalid input');
    }

    const { email, password } = result.data;

    // Find user by email - use lean() for performance and select only needed fields
    const user = await User.findOne({ email })
        .select('passwordHash name email role groups')
        .lean();
    t.mark('dbQuery');

    // Verify user exists and password matches
    if (user) {
        const isMatch = await matchPassword(password, user.passwordHash);
        t.mark('bcryptVerify');

        if (isMatch) {
            // Migrate to 10 rounds if currently different
            if (needsUpgrade(user.passwordHash)) {
                const newHash = await hashPassword(password);
                await User.findByIdAndUpdate(user._id, { passwordHash: newHash });
                console.log(`[AUTH] Upgraded password hash rounds for ${user.email}`);
            }
            t.mark('passwordUpgradeCheck');

            // Update user's online status
            await User.findByIdAndUpdate(user._id, {
                isOnline: true,
                lastSeen: new Date()
            });
            t.mark('dbUpdateStatus');

            t.end({ email: user.email, role: user.role });
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                groups: user.groups,
                isOnline: true,
                token: generateToken(user),
            });
            return;
        }
    }

    t.end({ error: 'Invalid credentials' });
    res.status(401);
    throw new Error('Invalid email or password');
});
