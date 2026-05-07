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
// @access  Public
    const t = createTimer('loginUser');
    t.mark('validate');
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        t.end({ error: 'Invalid input' });
        res.status(400);
        throw new Error('Invalid input');
    }

    const { email, password } = result.data;

    t.mark('dbQuery');
    // Find user by email - use lean() for performance and select only needed fields
    const user = await User.findOne({ email })
        .select('passwordHash name email role groups')
        .lean();

    // Verify user exists and password matches
    if (user) {
        t.mark('bcryptVerify');
        const isMatch = await matchPassword(password, user.passwordHash);

        if (isMatch) {
            t.mark('passwordUpgradeCheck');
            // Migrate to 8 rounds if currently higher
            if (needsUpgrade(user.passwordHash)) {
                const newHash = await hashPassword(password);
                await User.findByIdAndUpdate(user._id, { passwordHash: newHash });
                console.log(`[AUTH] Upgraded password hash rounds for ${user.email}`);
            }

            // Update user's online status
            await User.findByIdAndUpdate(user._id, {
                isOnline: true,
                lastSeen: new Date()
            });

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
