"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTravelers = exports.getComments = exports.addComment = exports.assignBooking = exports.updateBookingStatus = exports.createBooking = exports.getBookingById = exports.getBookings = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const client_1 = require("@prisma/client");
const types_1 = require("../types");
const prisma = new client_1.PrismaClient();
// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { status, assignedTo, search, fromDate, toDate, page = '1', limit = '10' } = req.query;
    const where = {};
    if (req.user?.role === 'AGENT') {
        where.assignedToUserId = req.user.id;
    }
    else if (assignedTo) {
        where.assignedToUserId = assignedTo;
    }
    if (status) {
        where.status = status;
    }
    if (search) {
        const searchStr = search;
        where.OR = [
            { contactPerson: { contains: searchStr } },
            { contactNumber: { contains: searchStr } },
            { requirements: { contains: searchStr } },
        ];
    }
    if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate)
            where.createdAt.gte = new Date(fromDate);
        if (toDate)
            where.createdAt.lte = new Date(toDate);
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
exports.getBookingById = (0, express_async_handler_1.default)(async (req, res) => {
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
// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Admin & Agent)
exports.createBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const result = types_1.createBookingSchema.safeParse(req.body);
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
// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.updateBookingStatusSchema.safeParse(req.body);
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
exports.assignBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.assignBookingSchema.safeParse(req.body);
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
exports.addComment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.createCommentSchema.safeParse(req.body);
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
            createdById: req.user.id,
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
exports.getComments = (0, express_async_handler_1.default)(async (req, res) => {
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
exports.addTravelers = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    // Support either single traveler object or array to match frontend requests
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = types_1.createTravelersSchema.safeParse(inputData);
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
    const createdTravelers = await prisma.$transaction(travelersData.map(data => prisma.traveler.create({ data })));
    res.status(201).json(createdTravelers);
});
