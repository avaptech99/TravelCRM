import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all agents
// @route   GET /api/users/agents
// @access  Private (Admin & Agent)
export const getAgents = asyncHandler(async (req: Request, res: Response) => {
    const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: { name: 'asc' },
    });

    res.json(agents);
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(users);
});
