import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Comment from '../models/Comment';
import Traveler from '../models/Traveler';
import User from '../models/User';
import Payment from '../models/Payment';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    assignBookingSchema,
    createCommentSchema,
    createTravelersSchema,
    updateBookingSchema,
    createPaymentSchema,
} from '../types';

// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, assignedTo, search, fromDate, toDate, page = '1', limit = '10' } = req.query;

    const query: any = {};

    if (req.user?.role === 'AGENT') {
        // If an agent is searching, allow them to search the entire DB
        if (!search) {
            query.assignedToUserId = req.user.id;
        }
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

    console.log(`[GET] /api/bookings - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);
    console.time("getBookingsQuery");
    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .select('contactPerson contactNumber status createdOn createdByUserId assignedToUserId requirements isConvertedToEDT pricePerTicket totalAmount createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('assignedToUser', 'name')
            .populate('createdByUser', 'name')
            .lean(),
        Booking.countDocuments(query),
    ]);
    console.timeEnd("getBookingsQuery");

    // Map _id to id for lean objects to satisfy frontend types
    const mappedBookings = bookings.map(b => ({
        ...b,
        id: b._id.toString()
    }));

    res.json({
        data: mappedBookings,
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
    const { id } = req.params;

    // Validate ObjectId to prevent 500 errors from CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid Booking ID');
    }

    console.log(`[GET] /api/bookings/${id}`);
    console.time(`getBookingById_${id}`);
    const booking = await Booking.findById(id)
        .populate('assignedToUser', 'name email')
        .populate('createdByUser', 'name')
        .populate({
            path: 'comments',
            populate: { path: 'createdBy', select: 'name role' },
            options: { sort: { createdAt: -1 } },
            select: 'text createdById createdAt'
        })
        .populate('travelers', 'name phoneNumber email isPrimary')
        .populate('payments', 'amount paymentMethod date remarks')
        .lean();
    console.timeEnd(`getBookingById_${id}`);

    if (!booking) {
        res.status(104); // Changed from 404 to be safe? No, 404 is correct.
        res.status(404);
        throw new Error('Booking not found');
    }

    res.json({ ...booking, id: booking._id.toString() });
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

    console.time(`deleteBooking_${req.params.id}`);
    // Parallel deletion of all related records
    await Promise.all([
        Comment.deleteMany({ bookingId: req.params.id }),
        Traveler.deleteMany({ bookingId: req.params.id }),
        Payment.deleteMany({ bookingId: req.params.id }),
        Notification.deleteMany({ bookingId: req.params.id }),
        Booking.findByIdAndDelete(req.params.id)
    ]);
    console.timeEnd(`deleteBooking_${req.params.id}`);

    res.json({ message: 'Booking and all related records removed successfully' });
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

    if (result.data.requirements !== undefined) {
        booking.requirements = result.data.requirements || null;
    }
    if (result.data.pricePerTicket !== undefined) {
        booking.pricePerTicket = result.data.pricePerTicket;
    }
    if (result.data.totalAmount !== undefined) {
        booking.totalAmount = result.data.totalAmount;
    }
    if (result.data.interested !== undefined) {
        booking.interested = result.data.interested;
    }

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

    if (assignedToUserId) {
        const agent = await User.findById(assignedToUserId);
        if (!agent || agent.role !== 'AGENT') {
            res.status(400);
            throw new Error('Invalid agent selected');
        }
    }

    const booking = await Booking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const previousAssignedUserId = booking.assignedToUserId?.toString() || null;
    const newAssignedUserId = assignedToUserId || null;

    if (previousAssignedUserId !== newAssignedUserId) {
        booking.assignedToUserId = newAssignedUserId as any;
        await booking.save();

        let previousAgentName = 'Unassigned';
        if (previousAssignedUserId) {
            const prevAgent = await User.findById(previousAssignedUserId);
            if (prevAgent) {
                previousAgentName = prevAgent.name;
            }
        }

        let newAgentName = 'Unassigned';
        if (newAssignedUserId) {
            const newAgent = await User.findById(newAssignedUserId);
            if (newAgent) {
                newAgentName = newAgent.name;
            }
        }

        const commentText = `${previousAgentName} ➔ ${newAgentName}`;

        await Comment.create({
            text: commentText,
            bookingId: id,
            createdById: req.user!.id,
        });

        if (newAssignedUserId) {
            await Notification.create({
                userId: newAssignedUserId,
                bookingId: id,
                message: `Booking has been assigned to you.`,
            });
        }
    }

    const updatedBooking = await Booking.findById(id).populate('assignedToUser', 'name');

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

    // Allow any authenticated user to view comments

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

// @desc    Add a payment to a booking
// @route   POST /api/bookings/:id/payments
// @access  Private
export const addPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = createPaymentSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid payment data');
    }

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add payment to this booking');
    }

    const payment = await Payment.create({
        ...result.data,
        bookingId: id,
    });

    res.status(201).json(payment);
});

// @desc    Get payments for a booking
// @route   GET /api/bookings/:id/payments
// @access  Private
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Allow any authenticated user to view payments

    const payments = await Payment.find({ bookingId: id }).sort({ date: -1 });

    res.json(payments);
});


// @desc    Delete a payment from a booking
// @route   DELETE /api/bookings/:id/payments/:paymentId
// @access  Private
export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
    const { id, paymentId } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete payment from this booking');
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.bookingId.toString() !== id) {
        res.status(404);
        throw new Error('Payment not found for this booking');
    }

    await Payment.findByIdAndDelete(paymentId);

    res.json({ message: 'Payment removed successfully' });
});
