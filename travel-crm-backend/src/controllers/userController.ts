import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import { createUserSchema } from '../types';
import bcrypt from 'bcryptjs';

// @desc    Get all agents
// @route   GET /api/users/agents
// @access  Private (Admin & Agent)
export const getAgents = asyncHandler(async (req: Request, res: Response) => {
    const agents = await User.find({ role: 'AGENT' })
        .select('name email') // id is included by default _id
        .sort({ name: 1 });

    res.json(agents);
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 });

    res.json(users);
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

    res.json({ message: 'User removed successfully' });
});
