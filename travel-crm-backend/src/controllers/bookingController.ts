import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient, Prisma } from '@prisma/client';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    assignBookingSchema,
    createCommentSchema,
    createTravelersSchema,
    updateBookingSchema,
} from '../types';

const prisma = new PrismaClient();

// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, assignedTo, search, fromDate, toDate, page = '1', limit = '10' } = req.query;

    const where: Prisma.BookingWhereInput = {};

    if (req.user?.role === 'AGENT') {
        where.assignedToUserId = req.user.id;
    } else if (assignedTo) {
        where.assignedToUserId = assignedTo as string;
    }

    if (status) {
        where.status = status as string;
    }

    if (search) {
        const searchStr = search as string;
        where.OR = [
            { contactPerson: { contains: searchStr } },
            { contactNumber: { contains: searchStr } },
            { requirements: { contains: searchStr } },
        ];
    }

    if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate as string);
        if (toDate) where.createdAt.lte = new Date(toDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                assignedToUser: { select: { id: true, name: true } },
                createdByUser: { select: { id: true, name: true } },
                comments: true,
                travelers: true,
            },
        }),
        prisma.booking.count({ where }),
    ]);

    res.json({
        data: bookings,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
            assignedToUser: { select: { id: true, name: true, email: true } },
            createdByUser: { select: { id: true, name: true } },
            comments: {
                include: { createdBy: { select: { id: true, name: true, role: true } } },
                orderBy: { createdAt: 'desc' },
            },
            travelers: true,
        },
    });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to access this booking');
    }

    res.json(booking);
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
    });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id && booking.createdByUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this booking');
    }

    await prisma.$transaction([
        prisma.comment.deleteMany({ where: { bookingId: req.params.id } }),
        prisma.traveler.deleteMany({ where: { bookingId: req.params.id } }),
        prisma.booking.delete({ where: { id: req.params.id } }),
    ]);

    res.json({ message: 'Booking removed successfully' });
});

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Admin & Agent)
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
    const result = createBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const booking = await prisma.booking.create({
        data: {
            ...result.data,
            createdByUserId: req.user?.id,
            assignedToUserId: req.user?.role === 'AGENT' ? req.user.id : null,
        },
    });

    res.status(201).json(booking);
});

// @desc    Update a booking (currently requirements)
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = updateBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id && booking.createdByUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            requirements: result.data.requirements,
        },
    });

    res.json(updatedBooking);
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = updateBookingStatusSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid status input');
    }

    const existingBooking = await prisma.booking.findUnique({ where: { id } });

    if (!existingBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && existingBooking.assignedToUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    const { status } = result.data;
    const isConvertedToEDT = status === 'Booked';

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status, isConvertedToEDT },
    });

    res.json(updatedBooking);
});

// @desc    Assign an agent to a booking
// @route   PATCH /api/bookings/:id/assign
// @access  Private (Admin only)
export const assignBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = assignBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const { assignedToUserId } = result.data;

    const agent = await prisma.user.findUnique({ where: { id: assignedToUserId } });
    if (!agent || agent.role !== 'AGENT') {
        res.status(400);
        throw new Error('Invalid agent selected');
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { assignedToUserId },
        include: {
            assignedToUser: { select: { id: true, name: true } },
        }
    });

    res.json(updatedBooking);
});

// @desc    Add comment to a booking
// @route   POST /api/bookings/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = createCommentSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid comment input');
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to comment on this booking');
    }

    const comment = await prisma.comment.create({
        data: {
            text: result.data.text,
            bookingId: id,
            createdById: req.user!.id,
        },
        include: {
            createdBy: { select: { id: true, name: true, role: true } },
        }
    });

    res.status(201).json(comment);
});

// @desc    Get comments for a booking
// @route   GET /api/bookings/:id/comments
// @access  Private
export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to view comments for this booking');
    }

    const comments = await prisma.comment.findMany({
        where: { bookingId: id },
        include: {
            createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(comments);
});

// @desc    Add travelers to a booking
// @route   POST /api/bookings/:id/travelers
// @access  Private
export const addTravelers = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Support either single traveler object or array to match frontend requests
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = createTravelersSchema.safeParse(inputData);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid traveler data');
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add travelers to this booking');
    }

    const travelersData = result.data.map(t => ({
        ...t,
        bookingId: id,
    }));

    const createdTravelers = await prisma.$transaction(
        travelersData.map(data => prisma.traveler.create({ data }))
    );

    res.status(201).json(createdTravelers);
});

// @desc    Update (replace) travelers for a booking
// @route   PUT /api/bookings/:id/travelers
// @access  Private
export const updateTravelers = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = createTravelersSchema.safeParse(inputData);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid traveler data');
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update travelers for this booking');
    }

    const travelersData = result.data.map(t => ({
        ...t,
        bookingId: id,
    }));

    // Delete existing travelers, then create new ones in a transaction
    const updatedTravelers = await prisma.$transaction(async (tx) => {
        await tx.traveler.deleteMany({ where: { bookingId: id } });
        const created = await Promise.all(
            travelersData.map(data => tx.traveler.create({ data }))
        );
        return created;
    });

    res.json(updatedTravelers);
});
