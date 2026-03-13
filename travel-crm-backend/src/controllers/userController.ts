import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import { createUserSchema } from '../types';
import bcrypt from 'bcryptjs';
import appCache from '../utils/cache';

// @desc    Get all agents
// @route   GET /api/users/agents
// @access  Private (Admin & Agent)
export const getAgents = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = 'users_agents';
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const agents = await User.find({ role: 'AGENT' })
        .select('name email')
        .sort({ name: 1 })
        .lean();

    const mappedAgents = agents.map(a => ({ ...a, id: a._id.toString() }));
    appCache.set(cacheKey, mappedAgents, 60); // Cache for 60 seconds (agents rarely change)
    res.json(mappedAgents);
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = 'users_all';
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const users = await User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .lean();

    const mappedUsers = users.map(u => ({ ...u, id: u._id.toString() }));
    appCache.set(cacheKey, mappedUsers, 60); // Cache for 60 seconds
    res.json(mappedUsers);
});

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const { name, email, password, role } = result.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        passwordHash,
        role,
    });

    // Invalidate user caches
    appCache.invalidateByPrefix('users_');

    res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    });
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Prevent deleting oneself
    if (req.user?.id === id) {
        res.status(400);
        throw new Error('Cannot delete your own account');
    }

    const user = await User.findById(id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'ADMIN') {
        const adminCount = await User.countDocuments({ role: 'ADMIN' });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error('Cannot delete the last admin user');
        }
    }

    await User.findByIdAndDelete(id);

    // Invalidate user caches
    appCache.invalidateByPrefix('users_');

    res.json({ message: 'User removed successfully' });
});

// @desc    Change password for logged in user
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
});
