"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.getPayments = exports.addPayment = exports.updateTravelers = exports.addTravelers = exports.getComments = exports.addComment = exports.assignBooking = exports.updateBookingStatus = exports.updateBooking = exports.createBooking = exports.deleteBooking = exports.getBookingById = exports.getBookings = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Traveler_1 = __importDefault(require("../models/Traveler"));
const User_1 = __importDefault(require("../models/User"));
const Payment_1 = __importDefault(require("../models/Payment"));
const types_1 = require("../types");
// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { status, assignedTo, search, fromDate, toDate, page = '1', limit = '10' } = req.query;
    const query = {};
    if (req.user?.role === 'AGENT') {
        // If an agent is searching, allow them to search the entire DB
        if (!search) {
            query.assignedToUserId = req.user.id;
        }
    }
    else if (assignedTo) {
        query.assignedToUserId = assignedTo;
    }
    if (status) {
        query.status = status;
    }
    if (search) {
        const searchStr = search;
        query.$or = [
            { contactPerson: { $regex: searchStr, $options: 'i' } },
            { contactNumber: { $regex: searchStr, $options: 'i' } },
            { requirements: { $regex: searchStr, $options: 'i' } },
        ];
    }
    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate)
            query.createdAt.$gte = new Date(fromDate);
        if (toDate)
            query.createdAt.$lte = new Date(toDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
        Booking_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('assignedToUser', 'name')
            .populate('createdByUser', 'name')
            .populate('comments')
            .populate('travelers')
            .populate('payments'),
        Booking_1.default.countDocuments(query),
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
    const booking = await Booking_1.default.findById(req.params.id)
        .populate('assignedToUser', 'name email')
        .populate('createdByUser', 'name')
        .populate({
        path: 'comments',
        populate: { path: 'createdBy', select: 'name role' },
        options: { sort: { createdAt: -1 } },
    })
        .populate('travelers')
        .populate('payments');
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    // Allow any authenticated user (Admins and Agents) to view the booking
    // This supports the 'search and self-assign' feature where agents can view
    // unassigned or other-assigned bookings from global search before taking ownership.
    res.json(booking);
});
// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const booking = await Booking_1.default.findById(req.params.id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id && booking.createdByUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this booking');
    }
    await Comment_1.default.deleteMany({ bookingId: req.params.id });
    await Traveler_1.default.deleteMany({ bookingId: req.params.id });
    await Booking_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking removed successfully' });
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
    const booking = await Booking_1.default.create({
        ...result.data,
        createdByUserId: req.user?.id,
        assignedToUserId: req.user?.role === 'AGENT' ? req.user.id : null,
    });
    res.status(201).json(booking);
});
// @desc    Update a booking (currently requirements)
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.updateBookingSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const booking = await Booking_1.default.findById(id);
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
exports.updateBookingStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.updateBookingStatusSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid status input');
    }
    const existingBooking = await Booking_1.default.findById(id);
    if (!existingBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'AGENT' && existingBooking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }
    const { status } = result.data;
    if (status === 'Booked') {
        const travelers = await Traveler_1.default.find({ bookingId: id });
        const hasFlightInfo = travelers.some(t => t.flightFrom && t.flightTo);
        if (!hasFlightInfo) {
            res.status(400);
            throw new Error('Please enter flight details for at least one traveler before marking as Booked');
        }
    }
    const isConvertedToEDT = status === 'Booked';
    existingBooking.status = status;
    existingBooking.isConvertedToEDT = isConvertedToEDT;
    const updatedBooking = await existingBooking.save();
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
    if (assignedToUserId) {
        const agent = await User_1.default.findById(assignedToUserId);
        if (!agent || agent.role !== 'AGENT') {
            res.status(400);
            throw new Error('Invalid agent selected');
        }
    }
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    const previousAssignedUserId = booking.assignedToUserId?.toString() || null;
    const newAssignedUserId = assignedToUserId || null;
    if (previousAssignedUserId !== newAssignedUserId) {
        booking.assignedToUserId = newAssignedUserId;
        await booking.save();
        let previousAgentName = 'Unassigned';
        if (previousAssignedUserId) {
            const prevAgent = await User_1.default.findById(previousAssignedUserId);
            if (prevAgent) {
                previousAgentName = prevAgent.name;
            }
        }
        let newAgentName = 'Unassigned';
        if (newAssignedUserId) {
            const newAgent = await User_1.default.findById(newAssignedUserId);
            if (newAgent) {
                newAgentName = newAgent.name;
            }
        }
        const commentText = `${previousAgentName} ➔ ${newAgentName}`;
        await Comment_1.default.create({
            text: commentText,
            bookingId: id,
            createdById: req.user.id,
        });
    }
    const updatedBooking = await Booking_1.default.findById(id).populate('assignedToUser', 'name');
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
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to comment on this booking');
    }
    let comment = await Comment_1.default.create({
        text: result.data.text,
        bookingId: id,
        createdById: req.user.id,
    });
    comment = await comment.populate('createdBy', 'name role');
    res.status(201).json(comment);
});
// @desc    Get comments for a booking
// @route   GET /api/bookings/:id/comments
// @access  Private
exports.getComments = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    // Allow any authenticated user to view comments
    const comments = await Comment_1.default.find({ bookingId: id })
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 });
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
    const booking = await Booking_1.default.findById(id);
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
    const createdTravelers = await Traveler_1.default.insertMany(travelersData);
    res.status(201).json(createdTravelers);
});
// @desc    Update (replace) travelers for a booking
// @route   PUT /api/bookings/:id/travelers
// @access  Private
exports.updateTravelers = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = types_1.createTravelersSchema.safeParse(inputData);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid traveler data');
    }
    const booking = await Booking_1.default.findById(id);
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
    await Traveler_1.default.deleteMany({ bookingId: id });
    const createdTravelers = await Traveler_1.default.insertMany(travelersData);
    res.json(createdTravelers);
});
// @desc    Add a payment to a booking
// @route   POST /api/bookings/:id/payments
// @access  Private
exports.addPayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.createPaymentSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid payment data');
    }
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add payment to this booking');
    }
    const payment = await Payment_1.default.create({
        ...result.data,
        bookingId: id,
    });
    res.status(201).json(payment);
});
// @desc    Get payments for a booking
// @route   GET /api/bookings/:id/payments
// @access  Private
exports.getPayments = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    // Allow any authenticated user to view payments
    const payments = await Payment_1.default.find({ bookingId: id }).sort({ date: -1 });
    res.json(payments);
});
// @desc    Delete a payment from a booking
// @route   DELETE /api/bookings/:id/payments/:paymentId
// @access  Private
exports.deletePayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id, paymentId } = req.params;
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete payment from this booking');
    }
    const payment = await Payment_1.default.findById(paymentId);
    if (!payment || payment.bookingId.toString() !== id) {
        res.status(404);
        throw new Error('Payment not found for this booking');
    }
    await Payment_1.default.findByIdAndDelete(paymentId);
    res.json({ message: 'Payment removed successfully' });
});
