import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Booking from '../models/Booking';
import { createUserSchema } from '../types';
import bcrypt from 'bcrypt';
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
        .select('name email isOnline lastSeen')
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
        .select('name email role isOnline lastSeen createdAt')
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

    const passwordHash = await bcrypt.hash(password, 8);

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

    user.passwordHash = await bcrypt.hash(newPassword, 8);
    await user.save();

    res.json({ message: 'Password changed successfully' });
});

// @desc    Update user profile (name, email)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email is already in use by another account');
        }
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    // Invalidate user caches
    appCache.invalidateByPrefix('users_');

    // Generate a new token since the payload contains name and email
    const { generateToken } = require('../utils/jwt');
    const newToken = generateToken(user);

    res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: newToken
    });
});

// @desc    Update user by ID (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email is already in use by another account');
        }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (role) user.role = role;

    if (password) {
        if (password.length < 6) {
            res.status(400);
            throw new Error('Password must be at least 6 characters');
        }
        user.passwordHash = await bcrypt.hash(password, 8);
    }

    await user.save();

    // Invalidate user caches
    appCache.invalidateByPrefix('users_');

    res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
});
// @desc    Update user status (Online/Offline)
// @route   PATCH /api/users/status
// @access  Private
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
        res.status(400);
        throw new Error('Status must be a boolean');
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.isOnline = isOnline;
    user.lastSeen = new Date();
    await user.save();

    // Invalidate user caches
    appCache.invalidateByPrefix('users_');

    res.json({
        id: user._id,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
    });
});

// @desc    Unassign bookings from offline agents
// @route   POST /api/users/unassign-offline-bookings
// @access  Private/Admin
export const unassignOfflineBookings = asyncHandler(async (req: Request, res: Response) => {
    const { timeThresholdMinutes } = req.body; // Default could be 60

    if (!timeThresholdMinutes || isNaN(timeThresholdMinutes)) {
        res.status(400);
        throw new Error('Invalid time threshold');
    }

    const thresholdDate = new Date(Date.now() - (timeThresholdMinutes * 60 * 1000));

    // Find all agents who are offline OR haven't been seen for a while
    const offlineAgents = await User.find({
        role: 'AGENT',
        $or: [
            { isOnline: false },
            { lastSeen: { $lt: thresholdDate } }
        ]
    }).select('_id');

    const offlineAgentIds = offlineAgents.map(a => a._id);

    if (offlineAgentIds.length === 0) {
        res.json({ message: 'No offline agents found matching criteria', modifiedCount: 0 });
        return;
    }

    // Unassign Pending/Working bookings from these agents
    const result = await Booking.updateMany(
        {
            assignedToUserId: { $in: offlineAgentIds },
            status: { $in: ['Pending', 'Working'] }
        },
        {
            $set: { assignedToUserId: null }
        }
    );

    // Invalidate booking and user caches
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('users_');

    res.json({
        message: `Successfully unassigned ${result.modifiedCount} bookings from ${offlineAgentIds.length} offline agents.`,
        modifiedCount: result.modifiedCount
    });
});

// @desc    Unassign Pending/Working bookings for a specific user
// @route   POST /api/users/:id/unassign-bookings
// @access  Private/Admin
export const unassignUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { timeThresholdMinutes } = req.body;

    const user = await User.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const query: any = {
        assignedToUserId: id,
        status: { $in: ['Pending', 'Working'] }
    };

    if (timeThresholdMinutes && !isNaN(timeThresholdMinutes) && parseInt(timeThresholdMinutes) > 0) {
        const thresholdDate = new Date(Date.now() - (parseInt(timeThresholdMinutes) * 60 * 1000));
        // We look for bookings that haven't been updated (worked on) since the threshold
        query.updatedAt = { $lt: thresholdDate };
    }

    const result = await Booking.updateMany(query, { $set: { assignedToUserId: null } });

    // Invalidate booking and user caches
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('users_');

    res.json({
        message: `Successfully unassigned ${result.modifiedCount} bookings from ${user.name}.`,
        modifiedCount: result.modifiedCount
    });
});
