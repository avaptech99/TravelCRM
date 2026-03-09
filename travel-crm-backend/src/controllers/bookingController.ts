import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Comment from '../models/Comment';
import Traveler from '../models/Traveler';
import User from '../models/User';
import mongoose from 'mongoose';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    assignBookingSchema,
    createCommentSchema,
    createTravelersSchema,
    updateBookingSchema,
} from '../types';

// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, assignedTo, search, fromDate, toDate, page = '1', limit = '10' } = req.query;

    const query: any = {};

    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    } else if (assignedTo) {
        query.assignedToUserId = assignedTo as string;
    }

    if (status) {
        query.status = status as string;
    }

    if (search) {
        const searchStr = search as string;
        query.$or = [
            { contactPerson: { $regex: searchStr, $options: 'i' } },
            { contactNumber: { $regex: searchStr, $options: 'i' } },
            { requirements: { $regex: searchStr, $options: 'i' } },
        ];
    }

    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate as string);
        if (toDate) query.createdAt.$lte = new Date(toDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('assignedToUser', 'name')
            .populate('createdByUser', 'name')
            .populate('comments')
            .populate('travelers'),
        Booking.countDocuments(query),
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
    const booking = await Booking.findById(req.params.id)
        .populate('assignedToUser', 'name email')
        .populate('createdByUser', 'name')
        .populate({
            path: 'comments',
            populate: { path: 'createdBy', select: 'name role' },
            options: { sort: { createdAt: -1 } },
        })
        .populate('travelers');

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to access this booking');
    }

    res.json(booking);
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id && booking.createdByUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this booking');
    }

    await Comment.deleteMany({ bookingId: req.params.id });
    await Traveler.deleteMany({ bookingId: req.params.id });
    await Booking.findByIdAndDelete(req.params.id);

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

    const booking = await Booking.create({
        ...result.data,
        createdByUserId: req.user?.id,
        assignedToUserId: req.user?.role === 'AGENT' ? req.user.id : null,
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

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id && booking.createdByUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    booking.requirements = result.data.requirements || null;
    const updatedBooking = await booking.save();

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

    const existingBooking = await Booking.findById(id);

    if (!existingBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && existingBooking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    const { status } = result.data;
    const isConvertedToEDT = status === 'Booked';

    existingBooking.status = status;
    existingBooking.isConvertedToEDT = isConvertedToEDT;
    const updatedBooking = await existingBooking.save();

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

    const agent = await User.findById(assignedToUserId);
    if (!agent || agent.role !== 'AGENT') {
        res.status(400);
        throw new Error('Invalid agent selected');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { assignedToUserId },
        { new: true }
    ).populate('assignedToUser', 'name');

    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }

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

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to comment on this booking');
    }

    let comment = await Comment.create({
        text: result.data.text,
        bookingId: id,
        createdById: req.user!.id,
    });

    comment = await comment.populate('createdBy', 'name role');

    res.status(201).json(comment);
});

// @desc    Get comments for a booking
// @route   GET /api/bookings/:id/comments
// @access  Private
export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to view comments for this booking');
    }

    const comments = await Comment.find({ bookingId: id })
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 });

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

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add travelers to this booking');
    }

    const travelersData = result.data.map(t => ({
        ...t,
        bookingId: id,
    }));

    const createdTravelers = await Traveler.insertMany(travelersData);

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

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update travelers for this booking');
    }

    const travelersData = result.data.map(t => ({
        ...t,
        bookingId: id,
    }));

    await Traveler.deleteMany({ bookingId: id });
    const createdTravelers = await Traveler.insertMany(travelersData);

    res.json(createdTravelers);
});
