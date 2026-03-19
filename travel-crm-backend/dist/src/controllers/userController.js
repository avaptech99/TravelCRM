"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unassignUserBookings = exports.unassignOfflineBookings = exports.updateStatus = exports.updateUserById = exports.updateProfile = exports.changePassword = exports.deleteUser = exports.createUser = exports.getAllUsers = exports.getAgents = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../models/User"));
const Booking_1 = __importDefault(require("../models/Booking"));
const types_1 = require("../types");
const bcrypt_1 = __importDefault(require("bcrypt"));
const cache_1 = __importDefault(require("../utils/cache"));
// @desc    Get all agents
// @route   GET /api/users/agents
// @access  Private (Admin & Agent)
exports.getAgents = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = 'users_agents';
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const agents = await User_1.default.find({ role: 'AGENT' })
        .select('name email isOnline lastSeen')
        .sort({ name: 1 })
        .lean();
    const mappedAgents = agents.map(a => ({ ...a, id: a._id.toString() }));
    cache_1.default.set(cacheKey, mappedAgents, 60); // Cache for 60 seconds (agents rarely change)
    res.json(mappedAgents);
});
// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = 'users_all';
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const users = await User_1.default.find()
        .select('name email role isOnline lastSeen createdAt')
        .sort({ createdAt: -1 })
        .lean();
    const mappedUsers = users.map(u => ({ ...u, id: u._id.toString() }));
    cache_1.default.set(cacheKey, mappedUsers, 60); // Cache for 60 seconds
    res.json(mappedUsers);
});
// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = (0, express_async_handler_1.default)(async (req, res) => {
    const result = types_1.createUserSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const { name, email, password, role } = result.data;
    const userExists = await User_1.default.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const passwordHash = await bcrypt_1.default.hash(password, 8);
    const user = await User_1.default.create({
        name,
        email,
        passwordHash,
        role,
    });
    // Invalidate user caches
    cache_1.default.invalidateByPrefix('users_');
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
exports.deleteUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    // Prevent deleting oneself
    if (req.user?.id === id) {
        res.status(400);
        throw new Error('Cannot delete your own account');
    }
    const user = await User_1.default.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (user.role === 'ADMIN') {
        const adminCount = await User_1.default.countDocuments({ role: 'ADMIN' });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error('Cannot delete the last admin user');
        }
    }
    await User_1.default.findByIdAndDelete(id);
    // Invalidate user caches
    cache_1.default.invalidateByPrefix('users_');
    res.json({ message: 'User removed successfully' });
});
// @desc    Change password for logged in user
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current password and new password are required');
    }
    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters');
    }
    const user = await User_1.default.findById(req.user?.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    const isMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }
    user.passwordHash = await bcrypt_1.default.hash(newPassword, 8);
    await user.save();
    res.json({ message: 'Password changed successfully' });
});
// @desc    Update user profile (name, email)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, email } = req.body;
    const user = await User_1.default.findById(req.user?.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (email && email !== user.email) {
        const emailExists = await User_1.default.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email is already in use by another account');
        }
    }
    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();
    // Invalidate user caches
    cache_1.default.invalidateByPrefix('users_');
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
exports.updateUserById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    const user = await User_1.default.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (email && email !== user.email) {
        const emailExists = await User_1.default.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email is already in use by another account');
        }
    }
    user.name = name || user.name;
    user.email = email || user.email;
    if (role)
        user.role = role;
    if (password) {
        if (password.length < 6) {
            res.status(400);
            throw new Error('Password must be at least 6 characters');
        }
        user.passwordHash = await bcrypt_1.default.hash(password, 8);
    }
    await user.save();
    // Invalidate user caches
    cache_1.default.invalidateByPrefix('users_');
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
exports.updateStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') {
        res.status(400);
        throw new Error('Status must be a boolean');
    }
    const user = await User_1.default.findById(req.user?.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.isOnline = isOnline;
    user.lastSeen = new Date();
    await user.save();
    // Invalidate user caches
    cache_1.default.invalidateByPrefix('users_');
    res.json({
        id: user._id,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
    });
});
// @desc    Unassign bookings from offline agents
// @route   POST /api/users/unassign-offline-bookings
// @access  Private/Admin
exports.unassignOfflineBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { timeThresholdMinutes } = req.body; // Default could be 60
    if (!timeThresholdMinutes || isNaN(timeThresholdMinutes)) {
        res.status(400);
        throw new Error('Invalid time threshold');
    }
    const thresholdDate = new Date(Date.now() - (timeThresholdMinutes * 60 * 1000));
    // Find all agents who are offline
    const offlineAgents = await User_1.default.find({
        role: 'AGENT',
        isOnline: false
    }).select('_id');
    const offlineAgentIds = offlineAgents.map(a => a._id);
    if (offlineAgentIds.length === 0) {
        res.json({ message: 'No offline agents found', modifiedCount: 0 });
        return;
    }
    // Unassign Pending/Working bookings from these agents created WITHIN the threshold
    // e.g. if 1 day is selected, catch all bookings from last 24h
    const result = await Booking_1.default.updateMany({
        assignedToUserId: { $in: offlineAgentIds },
        status: { $in: ['Pending', 'Working'] },
        createdAt: { $gte: thresholdDate }
    }, {
        $set: { assignedToUserId: null }
    });
    // Invalidate booking and user caches
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('users_');
    res.json({
        message: `Successfully unassigned ${result.modifiedCount} bookings from ${offlineAgentIds.length} offline agents.`,
        modifiedCount: result.modifiedCount
    });
});
// @desc    Unassign Pending/Working bookings for a specific user
// @route   POST /api/users/:id/unassign-bookings
// @access  Private/Admin
exports.unassignUserBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { timeThresholdMinutes } = req.body;
    const user = await User_1.default.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    const query = {
        assignedToUserId: id,
        status: { $in: ['Pending', 'Working'] }
    };
    if (timeThresholdMinutes && !isNaN(timeThresholdMinutes)) {
        const thresholdDate = new Date(Date.now() - (parseInt(timeThresholdMinutes) * 60 * 1000));
        // Catch bookings created WITHIN the last X minutes (e.g. recent work)
        query.createdAt = { $gte: thresholdDate };
    }
    const result = await Booking_1.default.updateMany(query, { $set: { assignedToUserId: null } });
    // Invalidate booking and user caches
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('users_');
    res.json({
        message: `Successfully unassigned ${result.modifiedCount} bookings from ${user.name}.`,
        modifiedCount: result.modifiedCount
    });
});
