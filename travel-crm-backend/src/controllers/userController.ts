import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';

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
