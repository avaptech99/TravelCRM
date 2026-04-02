"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingActivity = exports.getCalendarBookings = exports.deletePayment = exports.getPayments = exports.addPayment = exports.updatePassengers = exports.addPassengers = exports.getComments = exports.addComment = exports.bulkAssign = exports.assignBooking = exports.updateBookingStatus = exports.updateBooking = exports.createBooking = exports.deleteBooking = exports.getBookingById = exports.getBookings = exports.getRecentBookings = exports.getBookingStats = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const PrimaryContact_1 = __importDefault(require("../models/PrimaryContact"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Passenger_1 = __importDefault(require("../models/Passenger"));
const User_1 = __importDefault(require("../models/User"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Notification_1 = __importDefault(require("../models/Notification"));
const mongoose_1 = __importDefault(require("mongoose"));
const cache_1 = __importDefault(require("../utils/cache"));
const types_1 = require("../types");
const extractTravelInfo_1 = require("../utils/extractTravelInfo");
// Helper to clear all booking-related caches
const invalidateBookingCaches = () => {
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('stats_');
    cache_1.default.invalidateByPrefix('recent_');
    cache_1.default.invalidateByPrefix('booking_');
};
// @desc    Get booking stats (counts only, no data)
// @route   GET /api/bookings/stats
// @access  Private
exports.getBookingStats = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = `stats_${req.user?.id || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const query = {};
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = new mongoose_1.default.Types.ObjectId(req.user.id);
    }
    else if (req.user?.role === 'MARKETER') {
        query.createdByUserId = new mongoose_1.default.Types.ObjectId(req.user.id);
    }
    console.time('getBookingStats');
    const stats = await Booking_1.default.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                booked: { $sum: { $cond: [{ $eq: ["$status", "Booked"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                working: { $sum: { $cond: [{ $eq: ["$status", "Working"] }, 1, 0] } },
                sent: { $sum: { $cond: [{ $eq: ["$status", "Sent"] }, 1, 0] } }
            }
        }
    ]);
    console.timeEnd('getBookingStats');
    const result = stats.length > 0 ? {
        total: stats[0].total,
        booked: stats[0].booked,
        pending: stats[0].pending,
        working: stats[0].working,
        sent: stats[0].sent
    } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };
    cache_1.default.set(cacheKey, result, 120);
    res.json(result);
});
// @desc    Get recent bookings (lightweight, for dashboard)
// @route   GET /api/bookings/recent
// @access  Private
exports.getRecentBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = `recent_${req.user?.id || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const query = {};
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    }
    else if (req.user?.role === 'MARKETER') {
        query.createdByUserId = req.user.id;
    }
    const bookings = await Booking_1.default.find(query)
        .select('uniqueCode status assignedToUserId primaryContactId flightFrom flightTo destination travelDate amount createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedToUserId', 'name')
        .populate('primaryContact', 'contactName contactPhoneNo contactEmail bookingType')
        .lean();
    const mapped = bookings.map(b => ({
        ...b,
        id: b._id.toString(),
        createdOn: b.createdAt,
        contactPerson: b.primaryContact?.contactName,
        contactNumber: b.primaryContact?.contactPhoneNo,
        bookingType: b.primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        travellers: b.travellers,
        travelers: b.passengers,
        assignedToUser: b.assignedToUserId,
    }));
    cache_1.default.set(cacheKey, mapped, 60);
    res.json(mapped);
});
// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '10', myBookings } = req.query;
    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${page}_${limit}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const query = {};
    const primaryContactQuery = {};
    if (req.user?.role === 'MARKETER') {
        query.createdByUserId = req.user.id;
    }
    else if (myBookings === 'true') {
        query.$or = [
            { assignedToUserId: req.user?.id },
            { createdByUserId: req.user?.id },
        ];
    }
    else if (assignedTo) {
        query.assignedToUserId = assignedTo;
    }
    if (status) {
        const statusArray = status.split(',').map(s => s.trim());
        const bookingStatuses = statusArray.filter(s => !['Interested', 'Not Interested'].includes(s));
        const interestFilters = statusArray.filter(s => ['Interested', 'Not Interested'].includes(s));
        if (bookingStatuses.length > 0) {
            query.status = { $in: bookingStatuses };
        }
        if (interestFilters.length > 0) {
            const interestValues = interestFilters.map(f => f === 'Interested' ? 'Yes' : 'No');
            primaryContactQuery.interested = { $in: interestValues };
        }
    }
    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate)
            query.createdAt.$gte = new Date(fromDate);
        if (toDate)
            query.createdAt.$lte = new Date(toDate);
    }
    if (travelDateFilter && travelDateFilter !== 'all') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const futureDate = new Date(now);
        if (travelDateFilter === 'upcoming_7_days') {
            futureDate.setDate(now.getDate() + 7);
        }
        else if (travelDateFilter === 'upcoming_10_days') {
            futureDate.setDate(now.getDate() + 10);
        }
        else if (travelDateFilter === 'upcoming_15_days') {
            futureDate.setDate(now.getDate() + 15);
        }
        else if (travelDateFilter === 'upcoming_30_days') {
            futureDate.setDate(now.getDate() + 30);
        }
        futureDate.setHours(23, 59, 59, 999);
        query.travelDate = {
            $gte: now,
            $lte: futureDate
        };
    }
    if (search) {
        const searchStr = search;
        const searchRegex = new RegExp(searchStr, 'i');
        const contactSearchConditions = [
            { contactName: searchRegex },
            { contactPhoneNo: searchRegex },
            { requirements: searchRegex },
        ];
        if (primaryContactQuery.$or) {
            primaryContactQuery.$or.push(...contactSearchConditions);
        }
        else {
            primaryContactQuery.$or = contactSearchConditions;
        }
    }
    let contactIds = [];
    if (Object.keys(primaryContactQuery).length > 0) {
        const matchingContacts = await PrimaryContact_1.default.find(primaryContactQuery).select('_id').lean();
        contactIds = matchingContacts.map(c => c._id);
        if (contactIds.length === 0) {
            res.json({
                data: [],
                meta: {
                    total: 0,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: 0,
                },
            });
            return;
        }
        query.primaryContactId = { $in: contactIds };
    }
    if (search) {
        const searchStr = search;
        const searchRegex = new RegExp(searchStr, 'i');
        const bookingSearchFields = [
            { flightFrom: searchRegex },
            { flightTo: searchRegex },
        ];
        // If we have contactIds from the search, we want (contactMatch OR flightMatch)
        // BUT we also need to respect existing query filters (like status, agent)
        if (query.primaryContactId) {
            const searchOr = [
                { primaryContactId: query.primaryContactId },
                ...bookingSearchFields
            ];
            // Remove the single primaryContactId from query and use it in OR
            delete query.primaryContactId;
            if (query.$or) {
                // If we already have $or (like myBookings or Agent assignment), wrap in $and
                const existingOr = query.$or;
                delete query.$or;
                query.$and = [
                    { $or: existingOr },
                    { $or: searchOr }
                ];
            }
            else {
                query.$or = searchOr;
            }
        }
        else {
            // Just flight search
            if (query.$or) {
                const existingOr = query.$or;
                delete query.$or;
                query.$and = [
                    { $or: existingOr },
                    { $or: bookingSearchFields }
                ];
            }
            else {
                query.$or = bookingSearchFields;
            }
        }
    }
    const skip = (Number(page) - 1) * Number(limit);
    const reqId = Date.now().toString(36);
    console.log(`[GET] /api/bookings - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);
    console.time(`getBookingsQuery_${reqId}`);
    const [bookings, total] = await Promise.all([
        Booking_1.default.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate returnDate tripType amount travellers createdByUserId assignedToUserId createdByUser assignedToUser primaryContactId createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .populate('primaryContact', 'contactName contactPhoneNo requirements interested bookingType')
            .populate('passengers', 'name')
            .lean(),
        Booking_1.default.countDocuments(query),
    ]);
    console.timeEnd(`getBookingsQuery_${reqId}`);
    const mappedBookings = bookings.map(b => ({
        ...b,
        id: b._id.toString(),
        createdOn: b.createdAt,
        contactPerson: b.primaryContact?.contactName,
        contactNumber: b.primaryContact?.contactPhoneNo,
        contactEmail: b.primaryContact?.contactEmail,
        requirements: b.primaryContact?.requirements,
        interested: b.primaryContact?.interested,
        bookingType: b.primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        travellers: b.travellers,
        travelers: b.passengers,
        createdByUser: b.createdByUserId,
        assignedToUser: b.assignedToUserId,
    }));
    const result = {
        data: mappedBookings,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
    cache_1.default.set(cacheKey, result, 60);
    res.json(result);
});
// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid Booking ID');
    }
    const cacheKey = `booking_${id}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    console.log(`[GET] /api/bookings/${id}`);
    console.time(`getBookingById_${id}`);
    const booking = await Booking_1.default.findById(id)
        .populate('assignedToUserId', 'name email')
        .populate('createdByUserId', 'name')
        .populate('primaryContact', 'contactName contactPhoneNo contactEmail requirements interested bookingType')
        .populate({
        path: 'comments',
        populate: { path: 'createdBy', select: 'name role' },
        options: { sort: { createdAt: -1 } },
        select: 'text createdById createdAt'
    })
        .populate('passengers', 'name phoneNumber email dob anniversary country flightFrom flightTo departureTime arrivalTime tripType returnDate returnDepartureTime returnArrivalTime')
        .populate('payments', 'amount paymentMethod date remarks transactionId')
        .lean();
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'MARKETER' && booking.createdByUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to view this booking');
    }
    // Calculate outstanding for each payment context
    const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const outstanding = (booking.amount || 0) - totalPaid;
    const result = {
        ...booking,
        id: booking._id.toString(),
        createdOn: booking.createdAt,
        outstanding,
        contactPerson: booking.primaryContact?.contactName,
        contactNumber: booking.primaryContact?.contactPhoneNo,
        contactEmail: booking.primaryContact?.contactEmail,
        requirements: booking.primaryContact?.requirements,
        interested: booking.primaryContact?.interested,
        bookingType: booking.primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: booking.destination,
        travellers: booking.travellers,
        travelers: booking.passengers,
        createdByUser: booking.createdByUserId,
        assignedToUser: booking.assignedToUserId,
    };
    cache_1.default.set(cacheKey, result, 60);
    res.json(result);
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
    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Not authorized to delete bookings. Only Admins can perform this action.');
    }
    console.time(`deleteBooking_${req.params.id}`);
    // Parallel deletion of all related records
    await Promise.all([
        Comment_1.default.deleteMany({ bookingId: req.params.id }),
        Passenger_1.default.deleteMany({ bookingId: req.params.id }),
        Payment_1.default.deleteMany({ bookingId: req.params.id }),
        Notification_1.default.deleteMany({ bookingId: req.params.id }),
        booking.primaryContactId ? PrimaryContact_1.default.findByIdAndDelete(booking.primaryContactId) : Promise.resolve(),
        Booking_1.default.findByIdAndDelete(req.params.id)
    ]);
    console.timeEnd(`deleteBooking_${req.params.id}`);
    invalidateBookingCaches();
    res.json({ message: 'Booking and all related records removed successfully' });
});
// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Admin & Agent)
exports.createBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const startTime = Date.now();
    const result = types_1.createBookingSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    // Create PrimaryContact first
    const primaryContact = await PrimaryContact_1.default.create({
        contactName: result.data.contactPerson,
        contactPhoneNo: result.data.contactNumber,
        bookingType: result.data.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)',
        requirements: result.data.requirements || null,
    });
    // Extract info if not provided
    let finalDestination = result.data.destination || null;
    let finalTravelDate = result.data.travelDate ? new Date(result.data.travelDate) : null;
    let finalTravellers = result.data.travellers || null;
    if (result.data.requirements) {
        const parsedData = (0, extractTravelInfo_1.extractTravelInfo)(result.data.requirements);
        if (!finalDestination && parsedData.destinationCity)
            finalDestination = parsedData.destinationCity;
        if (!finalTravelDate && parsedData.travelDate)
            finalTravelDate = parsedData.travelDate;
        if (!finalTravellers && parsedData.travellers)
            finalTravellers = parsedData.travellers;
    }
    // Create booking
    const dbStart = Date.now();
    const booking = await Booking_1.default.create({
        destination: finalDestination,
        travelDate: finalTravelDate,
        flightFrom: result.data.flightFrom || null,
        flightTo: result.data.flightTo || null,
        tripType: result.data.tripType || 'one-way',
        amount: result.data.amount || 0,
        travellers: finalTravellers,
        primaryContactId: primaryContact._id,
        createdByUserId: req.user?.id,
        assignedToUserId: req.user?.role === 'AGENT' ? req.user.id : null,
        includesFlight: result.data.includesFlight ?? true,
        includesAdditionalServices: result.data.includesAdditionalServices ?? false,
        additionalServicesDetails: result.data.additionalServicesDetails || null,
        pricePerTicket: result.data.pricePerTicket || 0,
    });
    const dbTime = Date.now() - dbStart;
    const totalTime = Date.now() - startTime;
    console.log(`[BOOKING PERF] Create Booking - Total: ${totalTime}ms | DB: ${dbTime}ms`);
    // Populate for response
    const populatedBooking = await Booking_1.default.findById(booking._id)
        .populate('createdByUserId', 'name')
        .populate('assignedToUserId', 'name')
        .populate('primaryContact', 'contactName contactPhoneNo contactEmail requirements interested bookingType')
        .lean();
    const resultBooking = {
        ...populatedBooking,
        id: populatedBooking._id.toString(),
        createdOn: populatedBooking.createdAt,
        contactPerson: populatedBooking.primaryContact?.contactName,
        contactNumber: populatedBooking.primaryContact?.contactPhoneNo,
        contactEmail: populatedBooking.primaryContact?.contactEmail,
        requirements: populatedBooking.primaryContact?.requirements,
        interested: populatedBooking.primaryContact?.interested,
        bookingType: populatedBooking.primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: populatedBooking.destination,
        travellers: populatedBooking.travellers,
        travelers: populatedBooking.passengers,
        createdByUser: populatedBooking.createdByUserId,
        assignedToUser: populatedBooking.assignedToUserId,
    };
    invalidateBookingCaches();
    res.status(201).json(resultBooking);
});
// @desc    Update a booking
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
    if (req.user?.role === 'MARKETER') {
        if (booking.assignedToUserId) {
            res.status(403);
            throw new Error('Not authorized to update an assigned booking');
        }
        // Marketers can ONLY update requirements
        const allowedFields = ['requirements'];
        const keys = Object.keys(req.body);
        const forbiddenKeys = keys.filter(k => !allowedFields.includes(k));
        if (forbiddenKeys.length > 0) {
            res.status(403);
            throw new Error('Marketers are only authorized to update Detailed Requirements');
        }
    }
    else if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id && booking.createdByUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }
    // Update booking-level fields
    if (result.data.destination !== undefined)
        booking.destination = result.data.destination || null;
    if (result.data.travelDate !== undefined)
        booking.travelDate = result.data.travelDate ? new Date(result.data.travelDate) : null;
    if (result.data.flightFrom !== undefined)
        booking.flightFrom = result.data.flightFrom || null;
    if (result.data.flightTo !== undefined)
        booking.flightTo = result.data.flightTo || null;
    if (result.data.tripType !== undefined)
        booking.tripType = result.data.tripType || 'one-way';
    if (result.data.amount !== undefined)
        booking.amount = result.data.amount;
    if (result.data.totalAmount !== undefined)
        booking.totalAmount = result.data.totalAmount;
    if (result.data.finalQuotation !== undefined)
        booking.finalQuotation = result.data.finalQuotation;
    if (result.data.travellers !== undefined)
        booking.travellers = result.data.travellers || null;
    if (result.data.pricePerTicket !== undefined)
        booking.pricePerTicket = result.data.pricePerTicket;
    if (result.data.includesFlight !== undefined)
        booking.includesFlight = result.data.includesFlight;
    if (result.data.includesAdditionalServices !== undefined)
        booking.includesAdditionalServices = result.data.includesAdditionalServices;
    if (result.data.additionalServicesDetails !== undefined)
        booking.additionalServicesDetails = result.data.additionalServicesDetails || null;
    if (result.data.segments !== undefined) {
        booking.segments = (result.data.segments || []).map(s => ({
            from: s.from || '',
            to: s.to || '',
            date: s.date ? new Date(s.date) : null
        }));
    }
    await booking.save();
    // Update PrimaryContact fields if provided
    if (booking.primaryContactId && (result.data.requirements !== undefined || result.data.interested !== undefined)) {
        const updateData = {};
        if (result.data.requirements !== undefined)
            updateData.requirements = result.data.requirements;
        if (result.data.interested !== undefined)
            updateData.interested = result.data.interested;
        await PrimaryContact_1.default.findByIdAndUpdate(booking.primaryContactId, updateData);
    }
    const updatedBooking = await Booking_1.default.findById(id)
        .populate('primaryContact', 'contactName contactPhoneNo contactEmail requirements interested bookingType')
        .populate('assignedToUserId', 'name')
        .populate('createdByUserId', 'name')
        .lean();
    const resultBooking = {
        ...updatedBooking,
        id: updatedBooking._id.toString(),
        createdOn: updatedBooking.createdAt,
        contactPerson: updatedBooking.primaryContact?.contactName,
        contactNumber: updatedBooking.primaryContact?.contactPhoneNo,
        requirements: updatedBooking.primaryContact?.requirements,
        interested: updatedBooking.primaryContact?.interested,
        bookingType: updatedBooking.primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: updatedBooking.destination,
        travellers: updatedBooking.travellers,
        travelers: updatedBooking.passengers,
        createdByUser: updatedBooking.createdByUserId,
        assignedToUser: updatedBooking.assignedToUserId,
    };
    invalidateBookingCaches();
    res.json(resultBooking);
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
    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to update booking status');
    }
    if (req.user?.role === 'AGENT' && existingBooking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }
    const { status } = result.data;
    existingBooking.status = status;
    const updatedBooking = await existingBooking.save();
    // Notify Marketer if their lead status changed
    if (existingBooking.createdByUserId && existingBooking.createdByUserId.toString() !== req.user?.id) {
        const creator = await User_1.default.findById(existingBooking.createdByUserId);
        if (creator?.role === 'MARKETER') {
            await Notification_1.default.create({
                userId: existingBooking.createdByUserId,
                bookingId: id,
                message: `Status of your lead ${existingBooking.destination} updated to ${status}.`,
            });
        }
    }
    invalidateBookingCaches();
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
        if (newAssignedUserId) {
            await Notification_1.default.create({
                userId: newAssignedUserId,
                bookingId: id,
                message: `Booking has been assigned to you.`,
            });
            // Also notify the marketer who created the lead
            if (booking.createdByUserId) {
                const creator = await User_1.default.findById(booking.createdByUserId);
                if (creator?.role === 'MARKETER' && booking.createdByUserId.toString() !== req.user?.id) {
                    const agent = await User_1.default.findById(newAssignedUserId);
                    await Notification_1.default.create({
                        userId: booking.createdByUserId,
                        bookingId: id,
                        message: `Your lead has been assigned to ${agent?.name || 'an agent'}.`,
                    });
                }
            }
        }
    }
    const updatedBooking = await Booking_1.default.findById(id).populate('assignedToUser', 'name');
    invalidateBookingCaches();
    res.json(updatedBooking);
});
// @desc    Bulk assign bookings to an agent (or unassign)
// @route   POST /api/bookings/bulk-assign
// @access  Private (Admin only)
exports.bulkAssign = (0, express_async_handler_1.default)(async (req, res) => {
    // Schema check temporarily removed as bulkAssignSchema is not in types
    const { bookingIds, assignedToUserId } = req.body;
    if (assignedToUserId) {
        const agent = await User_1.default.findById(assignedToUserId);
        if (!agent || agent.role !== 'AGENT') {
            res.status(400);
            throw new Error('Invalid agent selected');
        }
    }
    const newAgentId = assignedToUserId || null;
    let newAgentName = 'Unassigned';
    if (newAgentId) {
        const newAgent = await User_1.default.findById(newAgentId);
        newAgentName = newAgent?.name || 'Unknown Agent';
    }
    // Process in bulk
    const bookings = await Booking_1.default.find({ _id: { $in: bookingIds } });
    // We'll use a for...of loop or map with Promise.all
    // For each booking, check if assignment changed, then update and create comment
    const updatePromises = bookings.map(async (booking) => {
        const previousAssignedUserId = booking.assignedToUserId?.toString() || null;
        if (previousAssignedUserId !== (newAgentId ? newAgentId.toString() : null)) {
            booking.assignedToUserId = newAgentId;
            await booking.save();
            let previousAgentName = 'Unassigned';
            if (previousAssignedUserId) {
                const prevAgent = await User_1.default.findById(previousAssignedUserId);
                previousAgentName = prevAgent?.name || 'Unknown Agent';
            }
            const commentText = `${previousAgentName} ➔ ${newAgentName}`;
            await Comment_1.default.create({
                text: commentText,
                bookingId: booking._id,
                createdById: req.user.id,
            });
            if (newAgentId) {
                await Notification_1.default.create({
                    userId: newAgentId,
                    bookingId: booking._id,
                    message: `Booking has been assigned to you.`,
                });
                // Also notify the marketer who created the lead
                if (booking.createdByUserId) {
                    const creator = await User_1.default.findById(booking.createdByUserId);
                    if (creator?.role === 'MARKETER' && booking.createdByUserId.toString() !== req.user?.id) {
                        await Notification_1.default.create({
                            userId: booking.createdByUserId,
                            bookingId: booking._id,
                            message: `Your lead has been assigned to ${newAgentName}.`,
                        });
                    }
                }
            }
        }
    });
    await Promise.all(updatePromises);
    invalidateBookingCaches();
    res.json({ message: `Successfully ${newAgentId ? 'assigned' : 'unassigned'} ${bookings.length} bookings` });
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
    // Notification Logic
    if (req.user?.role === 'MARKETER' && booking.assignedToUserId) {
        // Notify the assigned agent when marketer comments
        await Notification_1.default.create({
            userId: booking.assignedToUserId,
            bookingId: id,
            message: `Marketer ${req.user.name} added a remark on lead ${booking.destination || 'Unassigned'}.`,
        });
    }
    invalidateBookingCaches();
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
    const comments = await Comment_1.default.find({ bookingId: id })
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 });
    res.json(comments);
});
// @desc    Add passengers to a booking
// @route   POST /api/bookings/:id/passengers
// @access  Private
exports.addPassengers = (0, express_async_handler_1.default)(async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = types_1.createPassengersSchema.safeParse(inputData);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid passenger data');
    }
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to add passengers');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add passengers to this booking');
    }
    const passengersData = result.data.map(p => ({
        ...p,
        bookingId: id,
    }));
    const dbStart = Date.now();
    const createdPassengers = await Passenger_1.default.insertMany(passengersData);
    const dbTime = Date.now() - dbStart;
    const totalTime = Date.now() - startTime;
    console.log(`[PASSENGER PERF] Add Passengers - Total: ${totalTime}ms | DB: ${dbTime}ms | Count: ${passengersData.length}`);
    invalidateBookingCaches();
    res.status(201).json(createdPassengers);
});
// @desc    Update (replace) passengers for a booking
// @route   PUT /api/bookings/:id/passengers
// @access  Private
exports.updatePassengers = (0, express_async_handler_1.default)(async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = types_1.createPassengersSchema.safeParse(inputData);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid passenger data');
    }
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to update passengers');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update passengers for this booking');
    }
    const passengersData = result.data.map(p => ({
        ...p,
        bookingId: id,
    }));
    const dbStart = Date.now();
    await Passenger_1.default.deleteMany({ bookingId: id });
    const createdPassengers = await Passenger_1.default.insertMany(passengersData);
    const dbTime = Date.now() - dbStart;
    const totalTime = Date.now() - startTime;
    console.log(`[PASSENGER PERF] Update Passengers - Total: ${totalTime}ms | DB (Del+Ins): ${dbTime}ms | Count: ${passengersData.length}`);
    invalidateBookingCaches();
    res.json(createdPassengers);
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
    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to add payments');
    }
    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add payment to this booking');
    }
    const payment = await Payment_1.default.create({
        ...result.data,
        bookingId: id,
    });
    invalidateBookingCaches();
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
    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to delete payments');
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
    invalidateBookingCaches();
    res.json({ message: 'Payment removed successfully' });
});
// @desc    Get calendar bookings for a given month
// @route   GET /api/bookings/calendar
// @access  Private
exports.getCalendarBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);
    const query = {
        travelDate: { $gte: startDate, $lte: endDate },
    };
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    }
    const bookings = await Booking_1.default.find(query)
        .select('uniqueCode status destination travelDate primaryContactId')
        .populate('primaryContact', 'contactName')
        .lean();
    const events = bookings.map(b => ({
        id: b._id.toString(),
        title: b.primaryContact?.contactName || b.uniqueCode || 'Booking',
        date: b.travelDate,
        status: b.status,
        destination: b.destination || '',
    }));
    res.json(events);
});
// @desc    Get activity log for a booking
// @route   GET /api/bookings/:id/activity
// @access  Private
exports.getBookingActivity = (0, express_async_handler_1.default)(async (req, res) => {
    const { default: Activity } = await Promise.resolve().then(() => __importStar(require('../models/Activity')));
    const activities = await Activity.find({ bookingId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('userId', 'name')
        .lean();
    const mapped = activities.map(a => ({
        id: a._id.toString(),
        action: a.action,
        details: a.details,
        user: a.userId?.name || 'System',
        createdAt: a.createdAt,
    }));
    res.json(mapped);
});
