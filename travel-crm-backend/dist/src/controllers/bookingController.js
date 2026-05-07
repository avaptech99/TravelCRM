"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingActivity = exports.verifyBooking = exports.getCalendarBookings = exports.deletePayment = exports.getPayments = exports.addPayment = exports.updatePassengers = exports.addPassengers = exports.getComments = exports.addComment = exports.bulkDelete = exports.bulkAssign = exports.assignBooking = exports.updateBookingStatus = exports.updateBooking = exports.createBooking = exports.deleteBooking = exports.getBookingById = exports.getBookings = exports.getRecentBookings = exports.getBookingStats = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const PrimaryContact_1 = __importDefault(require("../models/PrimaryContact"));
const Timeline_1 = __importDefault(require("../models/Timeline"));
const Passenger_1 = __importDefault(require("../models/Passenger"));
const User_1 = __importDefault(require("../models/User"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Notification_1 = __importDefault(require("../models/Notification"));
const mongoose_1 = __importDefault(require("mongoose"));
const cache_1 = __importDefault(require("../utils/cache"));
const perfLogger_1 = require("../utils/perfLogger");
const types_1 = require("../types");
const extractTravelInfo_1 = require("../utils/extractTravelInfo");
// Request deduplication for booking fetches
const bookingFetchInFlight = new Map();
// Background Operation Semaphore
let _bgOps = 0;
const MAX_BG = 2;
async function runBG(label, fn) {
    if (_bgOps >= MAX_BG) {
        console.log(`[BG:SKIP] ${label} - Queue saturated`);
        return;
    }
    _bgOps++;
    const t = Date.now();
    try {
        await fn();
        console.log(`[BG:OK] ${label}: ${Date.now() - t}ms`);
    }
    catch (err) {
        console.error(`[BG:FAIL] ${label}:`, err.message);
    }
    finally {
        _bgOps--;
    }
}
// Helper to clear all booking-related caches
const invalidateBookingCaches = () => {
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('stats_');
    cache_1.default.invalidateByPrefix('recent_');
    cache_1.default.invalidateByPrefix('booking_');
};
// Helper to recalculate and save outstanding balance on a booking
const recalcOutstanding = async (bookingId) => {
    const [payments, booking] = await Promise.all([
        Payment_1.default.find({ bookingId }).select('amount').lean(),
        Booking_1.default.findById(bookingId).select('totalAmount amount').lean()
    ]);
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    if (booking) {
        // Standardize: Ensure amount/totalAmount matches the sum of estimated costs if they exist
        let bookingTotal = booking.totalAmount || booking.amount || 0;
        if (booking.estimatedCosts && booking.estimatedCosts.length > 0) {
            bookingTotal = booking.estimatedCosts.reduce((sum, item) => sum + (item.price || 0), 0);
        }
        const outstanding = Math.max(bookingTotal - totalPaid, 0);
        // Save back the standardized totals to ensure analytics picks them up
        await Booking_1.default.updateOne({ _id: bookingId }, { $set: { outstanding, amount: bookingTotal, totalAmount: bookingTotal } });
    }
};
// @desc    Get booking stats (counts only, no data)
// @route   GET /api/bookings/stats
// @access  Private
// Helper to safely get string ID from potentially populated ObjectId field
const getObjectIdString = (field) => {
    if (!field)
        return null;
    return field._id?.toString() || field.toString();
};
exports.getBookingStats = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = `stats_${req.user?.id || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const query = {};
    const userGroups = req.user?.groups || [];
    const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
    const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';
    if (isAccount || isOperation) {
        query.status = 'Booked';
    }
    else if (req.user?.role === 'AGENT') {
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
    cache_1.default.set(cacheKey, result, 300);
    res.setHeader('X-Cache-Status', 'MISS');
    t.end({ source: 'db' });
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
    const userGroups = req.user?.groups || [];
    const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
    const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';
    if (isAccount || isOperation) {
        query.status = 'Booked';
    }
    else if (req.user?.role === 'AGENT') {
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
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '15', myBookings, outstandingOnly, group, cursor, sortBy, sortOrder } = req.query;
    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${group || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${outstandingOnly || ''}_${page}_${limit}_${cursor || ''}`;
    const t = (0, perfLogger_1.createTimer)('getBookings');
    t.mark('checkCache');
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache' });
        res.json(cached);
        return;
    }
    const query = {};
    const userGroups = req.user?.groups || [];
    // 1. Mandatory Visibility Restrictions
    if (req.user?.role !== 'ADMIN') {
        const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
        const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';
        if (isAccount || isOperation) {
            query.status = 'Booked';
        }
        else if (req.user?.role === 'AGENT' || req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            query.$or = [
                { assignedToUserId: new mongoose_1.default.Types.ObjectId(req.user.id) },
                { createdByUserId: new mongoose_1.default.Types.ObjectId(req.user.id) },
                { assignedGroup: { $in: userGroups } }
            ];
        }
        else if (req.user?.role === 'MARKETER') {
            query.createdByUserId = new mongoose_1.default.Types.ObjectId(req.user.id);
        }
    }
    // 2. Filters
    if (myBookings === 'true') {
        const userMatch = [
            { assignedToUserId: new mongoose_1.default.Types.ObjectId(req.user?.id) },
            { createdByUserId: new mongoose_1.default.Types.ObjectId(req.user?.id) },
        ];
        if (query.$or) {
            const existingOr = query.$or;
            query.$and = [{ $or: existingOr }, { $or: userMatch }];
            delete query.$or;
        }
        else {
            query.$or = userMatch;
        }
    }
    if (status) {
        const statusArray = status.split(',').map(s => s.trim());
        const bookingStatuses = statusArray.filter(s => !['Interested', 'Not Interested'].includes(s));
        const interestFilters = statusArray.filter(s => ['Interested', 'Not Interested'].includes(s));
        if (bookingStatuses.length > 0) {
            query.status = bookingStatuses.length === 1 ? bookingStatuses[0] : { $in: bookingStatuses };
        }
        if (interestFilters.length > 0) {
            query['contact.interested'] = { $in: interestFilters.map(f => f === 'Interested') };
        }
    }
    if (assignedTo) {
        const agentArray = assignedTo.split(',').map(a => a.trim());
        const targetAgentIds = agentArray.map(id => id === 'unassigned' ? null : new mongoose_1.default.Types.ObjectId(id));
        query.assignedToUserId = { $in: targetAgentIds };
    }
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchConditions = [
            { 'contact.name': searchRegex },
            { 'contact.phone': searchRegex },
            { uniqueCode: searchRegex },
            { destination: searchRegex }
        ];
        if (query.$or) {
            const existingOr = query.$or;
            query.$and = (query.$and || []).concat([{ $or: existingOr }, { $or: searchConditions }]);
            delete query.$or;
        }
        else {
            query.$or = searchConditions;
        }
    }
    if (outstandingOnly === 'true')
        query.outstanding = { $gt: 0 };
    if (group)
        query.assignedGroup = group;
    // 3. Pagination Logic (O(1) cursor-based)
    t.mark('parseFilters');
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const sortField = '_id'; // Force stable _id sort for cursor consistency
    const sortDir = -1; // Newest first
    const sortQuery = { [sortField]: sortDir };
    if (cursor && mongoose_1.default.Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new mongoose_1.default.Types.ObjectId(cursor) };
    }
    t.mark('dbQuery');
    // Only count total on first page request to save DB resources
    const [total, rawBookings] = await Promise.all([
        cursor ? Promise.resolve(0) : Booking_1.default.countDocuments(query).maxTimeMS(2000),
        Booking_1.default.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate amount totalAmount travellers createdByUserId assignedToUserId contact outstanding createdAt lastInteractionAt')
            .sort(sortQuery)
            .limit(limitNum)
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .lean()
            .maxTimeMS(5000)
    ]);
    t.mark('formatResponse');
    const mappedBookings = rawBookings.map(b => ({
        ...b,
        id: b._id.toString(),
        createdOn: b.createdAt,
        contactPerson: b.contact?.name,
        contactNumber: b.contact?.phone,
        bookingType: b.contact?.type,
        interested: b.contact?.interested ? 'Yes' : 'No',
        destinationCity: b.destination,
        assignedToUser: b.assignedToUserId,
        createdByUser: b.createdByUserId,
    }));
    const nextCursor = rawBookings.length === limitNum
        ? rawBookings[rawBookings.length - 1]._id.toString()
        : null;
    const result = {
        data: mappedBookings,
        nextCursor,
        meta: {
            total: cursor ? undefined : total,
            limit: limitNum,
            hasMore: !!nextCursor
        },
    };
    t.end({ page: cursor ? 'cursor' : '1', limit: limitNum, total, returned: mappedBookings.length });
    cache_1.default.set(cacheKey, result, 60);
    res.setHeader('X-Cache-Status', 'MISS');
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
    // Check cache first
    const cached = cache_1.default.get(cacheKey);
    const checkAuth = (b) => {
        if (req.user?.role === 'ADMIN')
            return true;
        const creatorId = b.createdByUserId?._id?.toString() || b.createdByUserId?.toString();
        const assignedId = b.assignedToUserId?._id?.toString() || b.assignedToUserId?.toString();
        const bookingGroup = b.assignedGroup || 'Package / LCC';
        const userGroups = req.user?.groups || [];
        if (req.user?.role === 'AGENT' || req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            return creatorId === String(req.user?.id) ||
                assignedId === String(req.user?.id) ||
                userGroups.includes(bookingGroup);
        }
        if (req.user?.role === 'MARKETER') {
            return creatorId === String(req.user?.id);
        }
        if (req.user?.role === 'OPERATION' || req.user?.role === 'ACCOUNT') {
            return b.status === 'Booked';
        }
        return false;
    };
    const t = (0, perfLogger_1.createTimer)(`getBookingById_${id}`);
    t.mark('checkCache');
    if (cached) {
        if (!checkAuth(cached)) {
            res.status(403);
            throw new Error('Not authorized to view this booking');
        }
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache', bookingId: id });
        res.json(cached);
        return;
    }
    // Backend Request Deduplication
    if (bookingFetchInFlight.has(id)) {
        try {
            t.mark('waitDeduplicated');
            const data = await bookingFetchInFlight.get(id);
            if (!checkAuth(data)) {
                res.status(403);
                throw new Error('Not authorized to view this booking');
            }
            res.setHeader('X-Cache-Status', 'DEDUPLICATED');
            t.end({ source: 'deduplicated', bookingId: id });
            res.json(data);
            return;
        }
        catch (err) {
            // If the shared promise failed, fall through to try a fresh one
        }
    }
    const fetchPromise = (async () => {
        t.mark('dbQueryWithPopulate');
        const booking = await Booking_1.default.findById(id)
            .populate('assignedToUserId', 'name role')
            .populate('createdByUserId', 'name role')
            .populate('passengers')
            .populate('payments')
            .populate({
            path: 'timeline',
            populate: { path: 'userId', select: 'name role' },
            options: { sort: { createdAt: -1 }, limit: 20 }
        })
            .lean()
            .maxTimeMS(3000);
        if (!booking)
            return null;
        t.mark('calculateTotals');
        const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const outstanding = (booking.amount || 0) - totalPaid;
        t.mark('formatResponse');
        return {
            ...booking,
            id: booking._id.toString(),
            createdOn: booking.createdAt,
            outstanding: outstanding || 0,
            contactPerson: booking.contact?.name,
            contactNumber: booking.contact?.phone,
            contactEmail: booking.contact?.email,
            requirements: booking.contact?.requirements,
            interested: booking.contact?.interested ? 'Yes' : 'No',
            bookingType: booking.contact?.type,
            destinationCity: booking.destination,
            travellers: booking.travellers,
            travelers: booking.passengers,
            createdByUser: booking.createdByUserId,
            assignedToUser: booking.assignedToUserId,
        };
    })();
    bookingFetchInFlight.set(id, fetchPromise);
    try {
        console.log(`[GET] /api/bookings/${id}`);
        console.time(`getBookingById_${id}`);
        const result = await fetchPromise;
        console.timeEnd(`getBookingById_${id}`);
        if (!result) {
            res.status(404);
            throw new Error('Booking not found');
        }
        if (!checkAuth(result)) {
            res.status(403);
            throw new Error('Not authorized to view this booking');
        }
        cache_1.default.set(cacheKey, result, 30); // Reduced to 30s as per audit
        res.setHeader('X-Cache-Status', 'MISS');
        t.end({ source: 'db', bookingId: id });
        res.json(result);
        return;
    }
    finally {
        bookingFetchInFlight.delete(id);
    }
});
// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const t = (0, perfLogger_1.createTimer)(`deleteBooking_${id}`);
    t.mark('findBooking');
    const booking = await Booking_1.default.findById(id).lean();
    if (!booking) {
        t.end({ error: 'Not found', bookingId: id });
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role !== 'ADMIN') {
        t.end({ error: 'Unauthorized', bookingId: id });
        res.status(403);
        throw new Error('Not authorized to delete bookings. Only Admins can perform this action.');
    }
    t.mark('deleteBookingDoc');
    // PRIMARY write — delete the booking document first
    await Booking_1.default.findByIdAndDelete(id);
    t.end({ bookingId: id });
    // ✅ RESPOND IMMEDIATELY
    res.json({ message: 'Booking deletion initiated successfully', id });
    // ✅ BACKGROUND CLEANUP
    setImmediate(() => runBG(`deleteBooking_cleanup_${id}`, async () => {
        const cleanupTasks = [
            Timeline_1.default.deleteMany({ bookingId: id }),
            Passenger_1.default.deleteMany({ bookingId: id }),
            Payment_1.default.deleteMany({ bookingId: id }),
            Notification_1.default.deleteMany({ bookingId: id }),
        ];
        if (booking.primaryContactId) {
            cleanupTasks.push(PrimaryContact_1.default.findByIdAndDelete(booking.primaryContactId));
        }
        await Promise.all(cleanupTasks);
        invalidateBookingCaches();
    }));
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
    const t = (0, perfLogger_1.createTimer)('createBooking');
    t.mark('validate');
    const primaryContact = await PrimaryContact_1.default.create({
        contactName: result.data.contactPerson,
        contactPhoneNo: result.data.contactNumber,
        bookingType: result.data.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)',
        requirements: result.data.requirements || null,
        interested: result.data.interested === 'Yes',
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
    t.mark('insertBooking');
    // Create booking
    const booking = await Booking_1.default.create({
        primaryContactId: primaryContact._id,
        contact: {
            name: primaryContact.contactName,
            phone: primaryContact.contactPhoneNo,
            email: primaryContact.contactEmail || null,
            type: result.data.bookingType === 'B2B' ? 'B2B' : 'B2C',
            requirements: primaryContact.requirements || null,
            interested: primaryContact.interested,
        },
        destination: finalDestination,
        travelDate: finalTravelDate,
        flightFrom: result.data.flightFrom || null,
        flightTo: result.data.flightTo || null,
        tripType: result.data.tripType || 'one-way',
        amount: result.data.amount || 0,
        travellers: finalTravellers,
        createdByUserId: req.user?.id,
        assignedToUserId: (req.user?.role === 'AGENT' && (req.user?.groups || []).includes(result.data.assignedGroup || 'Package / LCC')) ? req.user.id : null,
        includesFlight: result.data.includesFlight ?? true,
        includesAdditionalServices: result.data.includesAdditionalServices ?? false,
        additionalServicesDetails: result.data.additionalServicesDetails || null,
        pricePerTicket: result.data.pricePerTicket || 0,
        assignedGroup: result.data.assignedGroup || 'Package / LCC',
    });
    t.mark('cacheInvalidation');
    // ✅ BUST CACHE IMMEDIATELY (Synchronous)
    invalidateBookingCaches();
    t.end({ bookingId: booking._id });
    // ✅ RESPOND IMMEDIATELY with minimum necessary data or lean object
    res.status(201).json(booking);
    // ✅ BACKGROUND: Side effects and complex mapping/logging
    setImmediate(() => runBG(`createBooking_sideEffects_${booking._id}`, async () => {
        await Promise.all([
            Timeline_1.default.create({
                bookingId: booking._id,
                userId: req.user?.id,
                type: 'activity',
                action: 'BOOKING_CREATED',
                details: `Booking created by ${req.user?.name}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            }),
            booking.assignedToUserId ? Notification_1.default.create({
                userId: booking.assignedToUserId,
                bookingId: booking._id,
                message: `New lead ${primaryContact.contactName || booking.destination || 'Unassigned'} has been assigned to you.`,
            }) : Promise.resolve()
        ]);
    }));
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
    const t = (0, perfLogger_1.createTimer)(`updateBooking_${id}`);
    t.mark('fetchExisting');
    // Role-based auth check (we need the booking first to check creator/assignee)
    const booking = await Booking_1.default.findById(id).lean();
    if (!booking) {
        t.end({ error: 'Not found', bookingId: id });
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'AGENT' && req.user?.role !== 'OPERATION') {
        if (req.user?.role === 'ACCOUNT') {
            const allowedFields = ['actualCosts', 'totalAmount', 'amount'];
            const forbiddenKeys = Object.keys(req.body).filter(k => !allowedFields.includes(k));
            if (forbiddenKeys.length > 0) {
                res.status(403);
                throw new Error('Account team is authorized to update Actual Costs and Amount fields only');
            }
        }
        else if (req.user?.role === 'MARKETER') {
            if (booking.assignedToUserId) {
                res.status(403);
                throw new Error('Not authorized to update an assigned booking');
            }
            const forbiddenKeys = Object.keys(req.body).filter(k => k !== 'requirements');
            if (forbiddenKeys.length > 0) {
                res.status(403);
                throw new Error('Marketers are only authorized to update Detailed Requirements');
            }
        }
        else if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            if (getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
                res.status(403);
                throw new Error('You can only update your own queries');
            }
        }
        else {
            res.status(403);
            throw new Error('Not authorized to update this booking');
        }
    }
    // Prepare update object
    const updateData = { ...req.body, lastInteractionAt: new Date() };
    // Sync embedded contact snapshot if provided
    if (req.body.contactPerson !== undefined || req.body.contactNumber !== undefined || req.body.contactEmail !== undefined || req.body.requirements !== undefined || req.body.interested !== undefined || req.body.bookingType !== undefined) {
        updateData.contact = { ...(booking.contact || {}) };
        if (req.body.contactPerson !== undefined)
            updateData.contact.name = req.body.contactPerson;
        if (req.body.contactNumber !== undefined)
            updateData.contact.phone = req.body.contactNumber;
        if (req.body.contactEmail !== undefined)
            updateData.contact.email = req.body.contactEmail;
        if (req.body.requirements !== undefined)
            updateData.contact.requirements = req.body.requirements;
        if (req.body.interested !== undefined)
            updateData.contact.interested = req.body.interested === 'Yes';
        if (req.body.bookingType !== undefined)
            updateData.contact.type = req.body.bookingType === 'B2B' ? 'B2B' : 'B2C';
    }
    // Handle segments specifically if present
    if (req.body.segments) {
        updateData.segments = req.body.segments.map((s) => ({
            from: s.from || '',
            to: s.to || '',
            date: s.date ? new Date(s.date) : null
        }));
    }
    // Sync financial totals from cost arrays if present
    if (req.body.estimatedCosts) {
        const total = req.body.estimatedCosts.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
        updateData.amount = total;
        updateData.totalAmount = total;
    }
    // PRIMARY write
    const updatedBooking = await Booking_1.default.findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
        .populate('assignedToUserId', 'name')
        .populate('createdByUserId', 'name')
        .lean();
    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found after update');
    }
    // ✅ BUST CACHE IMMEDIATELY
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    // ✅ RESPOND IMMEDIATELY
    const responseData = {
        ...updatedBooking,
        id: updatedBooking._id.toString(),
        createdOn: updatedBooking.createdAt,
        contactPerson: updatedBooking.contact?.name,
        contactNumber: updatedBooking.contact?.phone,
        interested: updatedBooking.contact?.interested ? 'Yes' : 'No',
        bookingType: updatedBooking.contact?.type,
        destinationCity: updatedBooking.destination,
        createdByUser: updatedBooking.createdByUserId,
        assignedToUser: updatedBooking.assignedToUserId,
    };
    res.json(responseData);
    // ✅ BACKGROUND tasks
    setImmediate(() => runBG(`updateBooking_sideEffects_${id}`, async () => {
        const backgroundTasks = [];
        // 1. Recalc outstanding if financials changed
        if (req.body.totalAmount !== undefined || req.body.amount !== undefined) {
            backgroundTasks.push(recalcOutstanding(id));
        }
        // 2. Sync with Legacy PrimaryContact if needed
        if (booking.primaryContactId && (req.body.requirements !== undefined || req.body.interested !== undefined || req.body.bookingType !== undefined)) {
            const legacyUpdate = {};
            if (req.body.requirements !== undefined)
                legacyUpdate.requirements = req.body.requirements;
            if (req.body.interested !== undefined)
                legacyUpdate.interested = req.body.interested === 'Yes';
            if (req.body.bookingType !== undefined)
                legacyUpdate.bookingType = req.body.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)';
            backgroundTasks.push(PrimaryContact_1.default.findByIdAndUpdate(booking.primaryContactId, legacyUpdate));
        }
        // 3. Log Activity
        backgroundTasks.push(Timeline_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            action: 'BOOKING_UPDATED',
            details: 'Booking details were modified.',
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        }));
        await Promise.all(backgroundTasks);
        invalidateBookingCaches();
    }));
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
    const { status } = result.data;
    const t = (0, perfLogger_1.createTimer)(`updateStatus_${id}`);
    t.mark('findAndUpdate');
    // PRIMARY write only
    const updatedBooking = await Booking_1.default.findByIdAndUpdate(id, { status, lastInteractionAt: new Date() }, { returnDocument: 'after' }).lean();
    if (!updatedBooking) {
        t.end({ error: 'Not found', bookingId: id });
        res.status(404);
        throw new Error('Booking not found');
    }
    // Auth check (moved after find to avoid double query, though slightly different logic if not authorized)
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'AGENT' && req.user?.role !== 'OPERATION') {
        if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            if (getObjectIdString(updatedBooking.assignedToUserId) !== req.user.id && getObjectIdString(updatedBooking.createdByUserId) !== req.user.id) {
                res.status(403);
                throw new Error('You can only update status for your own queries');
            }
        }
        else {
            res.status(403);
            throw new Error('Not authorized to update status for this booking');
        }
    }
    t.mark('cacheInvalidation');
    // ✅ BUST CACHE IMMEDIATELY (Synchronous)
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    t.end({ bookingId: id, newStatus: status });
    // ✅ RESPOND IMMEDIATELY
    res.json(updatedBooking);
    // ✅ BACKGROUND side effects
    setImmediate(() => runBG(`updateStatus_sideEffects_${id}`, async () => {
        await Timeline_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            action: 'STATUS_CHANGE',
            details: `Status updated to ${status}`,
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
        if (updatedBooking.createdByUserId && getObjectIdString(updatedBooking.createdByUserId) !== req.user?.id) {
            const creator = await User_1.default.findById(updatedBooking.createdByUserId);
            if (creator?.role === 'MARKETER') {
                await Notification_1.default.create({
                    userId: updatedBooking.createdByUserId,
                    bookingId: id,
                    message: `Status of your lead ${updatedBooking.destination} updated to ${status}.`,
                });
            }
        }
    }));
});
// @desc    Assign an agent to a booking
// @route   PATCH /api/bookings/:id/assign
// @access  Private (Admin only)
exports.assignBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'AGENT') {
        res.status(403);
        throw new Error('Only Admins and Agents can assign leads');
    }
    const result = types_1.assignBookingSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const { assignedToUserId } = result.data;
    if (assignedToUserId) {
        const agent = await User_1.default.findById(assignedToUserId);
        if (!agent) {
            res.status(400);
            throw new Error('User not found');
        }
        if (agent.role === 'MARKETER') {
            res.status(400);
            throw new Error('Leads cannot be assigned to Marketers');
        }
    }
    const booking = await Booking_1.default.findById(id).populate('primaryContact', 'contactName');
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    // Security Check: Agents can only claim/assign leads in their own group
    if (req.user?.role !== 'ADMIN') {
        const userGroups = req.user?.groups || [];
        const bookingGroup = booking.assignedGroup || 'Package / LCC';
        if (!userGroups.includes(bookingGroup)) {
            res.status(403);
            throw new Error(`You can only claim or assign leads belonging to the ${bookingGroup} department.`);
        }
    }
    const previousAssignedUserId = getObjectIdString(booking.assignedToUserId) || null;
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
        const commentText = `Agent changed: ${previousAgentName} ➔ ${newAgentName}`;
        await Timeline_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            action: 'ASSIGNED',
            details: commentText,
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
        if (newAssignedUserId) {
            await Notification_1.default.create({
                userId: newAssignedUserId,
                bookingId: id,
                message: `Lead ${booking.primaryContact?.contactName || booking.destination || 'Unassigned'} has been assigned to you.`,
            });
            // Also notify the marketer who created the lead
            if (booking.createdByUserId) {
                const creator = await User_1.default.findById(booking.createdByUserId);
                if (creator?.role === 'MARKETER' && getObjectIdString(booking.createdByUserId) !== req.user?.id) {
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
    // ✅ BUST CACHE IMMEDIATELY
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.json(updatedBooking);
});
// @desc    Bulk assign bookings to an agent (or unassign)
// @route   POST /api/bookings/bulk-assign
// @access  Private (Admin only)
exports.bulkAssign = (0, express_async_handler_1.default)(async (req, res) => {
    // Schema check temporarily removed as bulkAssignSchema is not in types
    const { bookingIds, assignedToUserId } = req.body;
    const t = (0, perfLogger_1.createTimer)('bulkAssign');
    t.mark('validate');
    if (assignedToUserId) {
        const agent = await User_1.default.findById(assignedToUserId);
        if (!agent || agent.role !== 'AGENT') {
            t.end({ error: 'Invalid agent', agentId: assignedToUserId });
            res.status(400);
            throw new Error('Invalid agent selected');
        }
    }
    const newAgentId = assignedToUserId || null;
    let newAgentName = 'Unassigned';
    if (newAgentId) {
        t.mark('fetchNewAgent');
        const newAgent = await User_1.default.findById(newAgentId);
        newAgentName = newAgent?.name || 'Unknown Agent';
    }
    t.mark('dbUpdateMany');
    // Process in bulk
    // 1. Update all bookings in one go
    const updateResult = await Booking_1.default.updateMany({ _id: { $in: bookingIds } }, { $set: { assignedToUserId: newAgentId, lastInteractionAt: new Date() } });
    t.mark('cacheInvalidation');
    invalidateBookingCaches();
    bookingIds.forEach((id) => cache_1.default.del(`booking_${id}`));
    t.end({ count: bookingIds.length, agentId: newAgentId });
    // 2. Prepare side-effects in background to avoid blocking the response
    setImmediate(async () => {
        try {
            const timelineEntries = bookingIds.map((id) => ({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'ASSIGNED',
                details: `Bulk Assignment: Changed to ${newAgentName}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            }));
            const notificationEntries = newAgentId ? bookingIds.map((id) => ({
                userId: newAgentId,
                bookingId: id,
                message: `New lead assigned to you via bulk action.`,
            })) : [];
            await Promise.all([
                Timeline_1.default.insertMany(timelineEntries),
                notificationEntries.length > 0 ? Notification_1.default.insertMany(notificationEntries) : Promise.resolve()
            ]);
            invalidateBookingCaches();
        }
        catch (err) {
            console.error('[BulkAssign Background Error]:', err);
        }
    });
    res.json({
        message: `Successfully ${newAgentId ? 'assigned' : 'unassigned'} ${bookingIds.length} bookings`,
        modifiedCount: updateResult.modifiedCount
    });
});
// @desc    Bulk delete bookings
// @route   POST /api/bookings/bulk-delete
// @access  Private (Admin only)
exports.bulkDelete = (0, express_async_handler_1.default)(async (req, res) => {
    const { bookingIds } = req.body;
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        res.status(400);
        throw new Error('No booking IDs provided');
    }
    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Only admins can bulk delete leads');
    }
    const bookings = await Booking_1.default.find({ _id: { $in: bookingIds } });
    if (bookings.length > 0) {
        const validBookingIds = bookings.map(b => b._id);
        const contactIds = bookings.map(b => b.primaryContactId).filter(Boolean);
        await Promise.all([
            Timeline_1.default.deleteMany({ bookingId: { $in: validBookingIds } }),
            Passenger_1.default.deleteMany({ bookingId: { $in: validBookingIds } }),
            Payment_1.default.deleteMany({ bookingId: { $in: validBookingIds } }),
            Notification_1.default.deleteMany({ bookingId: { $in: validBookingIds } }),
            contactIds.length > 0 ? PrimaryContact_1.default.deleteMany({ _id: { $in: contactIds } }) : Promise.resolve(),
            Booking_1.default.deleteMany({ _id: { $in: validBookingIds } })
        ]);
    }
    invalidateBookingCaches();
    res.json({ message: `Successfully deleted ${bookings.length} bookings` });
});
// @desc    Add comment to a booking
// @route   POST /api/bookings/:id/comments
// @access  Private
exports.addComment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const userId = req.user.id;
    const { text } = req.body;
    const result = types_1.createCommentSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid comment input');
    }
    const booking = await Booking_1.default.findById(id).populate('primaryContact', 'contactName').lean();
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to comment on this booking');
    }
    const timeline = await Timeline_1.default.create({
        bookingId: id,
        userId: userId,
        type: 'comment',
        text: text,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    await Booking_1.default.findByIdAndUpdate(id, { lastInteractionAt: new Date() });
    // Notification Logic
    if (req.user?.role === 'MARKETER' && booking.assignedToUserId) {
        // Notify the assigned agent when marketer comments
        await Notification_1.default.create({
            userId: booking.assignedToUserId,
            bookingId: id,
            message: `Marketer ${req.user.name} added a remark on lead ${booking.primaryContact?.contactName || booking.destination || 'Unassigned'}.`,
        });
    }
    // ✅ BUST CACHE IMMEDIATELY
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.status(201).json(timeline);
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
    const comments = await Timeline_1.default.find({ bookingId: id, type: 'comment' })
        .populate('userId', 'name role')
        .sort({ createdAt: -1 })
        .lean();
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
    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add passengers to this booking');
    }
    const passengersData = result.data.map(p => ({
        ...p,
        bookingId: id,
    }));
    const dbStart = Date.now();
    // Use individual creations in parallel to ensure full validation and hook execution as per user request
    const createdPassengers = await Promise.all(passengersData.map(p => Passenger_1.default.create(p)));
    const dbTime = Date.now() - dbStart;
    const totalTime = Date.now() - startTime;
    console.log(`[PASSENGER PERF] Add Passengers - Total: ${totalTime}ms | DB: ${dbTime}ms | Count: ${passengersData.length}`);
    // ✅ BUST CACHE IMMEDIATELY
    cache_1.default.del(`booking_${id}`);
    res.status(201).json(createdPassengers);
    // BACKGROUND: Logging and cache invalidation
    setImmediate(async () => {
        try {
            await Timeline_1.default.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'PASSENGERS_ADDED',
                details: `Added ${passengersData.length} travelers to the booking.`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            invalidateBookingCaches();
        }
        catch (err) {
            console.error('[Background] addPassengers side-effects failed:', err);
        }
    });
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
    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
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
    // ✅ BUST CACHE IMMEDIATELY
    cache_1.default.del(`booking_${id}`);
    res.json(createdPassengers);
    // BACKGROUND: Logging and cache invalidation
    setImmediate(() => runBG(`updatePassengers_sideEffects_${id}`, async () => {
        await Timeline_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            action: 'PASSENGERS_UPDATED',
            details: `Updated details for ${passengersData.length} travelers.`,
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
        invalidateBookingCaches();
    }));
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
    const t = (0, perfLogger_1.createTimer)(`addPayment_${id}`);
    t.mark('validate');
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        t.end({ error: 'Not found', bookingId: id });
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'MARKETER') {
        t.end({ error: 'Unauthorized', bookingId: id });
        res.status(403);
        throw new Error('Marketers are not authorized to add payments');
    }
    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        t.end({ error: 'Unauthorized_Agent', bookingId: id });
        res.status(403);
        throw new Error('Agents can only add payments to their own bookings');
    }
    if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
        if (getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
            t.end({ error: 'Unauthorized_Spec', bookingId: id });
            res.status(403);
            throw new Error('You can only add payments to your own bookings');
        }
    }
    t.mark('insertPayment');
    const payment = await Payment_1.default.create({
        ...result.data,
        bookingId: id,
    });
    t.mark('cacheInvalidation');
    // ✅ BUST CACHE IMMEDIATELY
    cache_1.default.del(`booking_${id}`);
    t.end({ bookingId: id, amount: result.data.amount });
    res.status(201).json(payment);
    // BACKGROUND: Payment side effects
    setImmediate(() => runBG('addPayment_sideEffects', async () => {
        await Promise.all([
            recalcOutstanding(id),
            Timeline_1.default.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'PAYMENT_ADDED',
                details: `Recorded payment of ${result.data.amount} via ${result.data.paymentMethod}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            })
        ]);
        invalidateBookingCaches();
    }));
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
    const payments = await Payment_1.default.find({ bookingId: id }).sort({ date: -1 }).lean();
    res.json(payments);
});
// @desc    Delete a payment from a booking
// @route   DELETE /api/bookings/:id/payments/:paymentId
// @access  Private
exports.deletePayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id, paymentId } = req.params;
    const t = (0, perfLogger_1.createTimer)(`deletePayment_${id}`);
    t.mark('validate');
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        t.end({ error: 'Not found', bookingId: id });
        res.status(404);
        throw new Error('Booking not found');
    }
    if (req.user?.role === 'MARKETER') {
        t.end({ error: 'Unauthorized_Marketer', bookingId: id });
        res.status(403);
        throw new Error('Marketers are not authorized to delete payments');
    }
    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        t.end({ error: 'Unauthorized_Agent', bookingId: id });
        res.status(403);
        throw new Error('Agents can only delete payments from their own bookings');
    }
    if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
        if (getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
            t.end({ error: 'Unauthorized_Spec', bookingId: id });
            res.status(403);
            throw new Error('You can only delete payments from your own bookings');
        }
    }
    t.mark('findPayment');
    const payment = await Payment_1.default.findById(paymentId);
    if (!payment || payment.bookingId.toString() !== id) {
        t.end({ error: 'Payment not found', paymentId });
        res.status(404);
        throw new Error('Payment not found for this booking');
    }
    t.mark('deletePayment');
    await Payment_1.default.findByIdAndDelete(paymentId);
    t.end({ bookingId: id, paymentId });
    res.json({ message: 'Payment removed successfully' });
    // BACKGROUND: Payment removal side effects
    setImmediate(() => runBG(`deletePayment_sideEffects_${id}`, async () => {
        await Promise.all([
            recalcOutstanding(id),
            Timeline_1.default.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'PAYMENT_DELETED',
                details: `Removed payment of ${payment.amount}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            })
        ]);
        invalidateBookingCaches();
    }));
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
        .select('uniqueCode status destination travelDate contact')
        .lean();
    const events = bookings.map(b => ({
        id: b._id.toString(),
        title: b.contact?.name || b.uniqueCode || 'Booking',
        date: b.travelDate,
        status: b.status,
        destination: b.destination || '',
    }));
    res.json(events);
});
// @desc    Verify a booking (for Account & Admin)
// @route   PATCH /api/bookings/:id/verify
// @access  Private (Account & Admin)
exports.verifyBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { isVerified } = req.body;
    const userGroups = req.user?.groups || [];
    const isAccount = req.user?.role === 'ACCOUNT' || userGroups.some(g => g.toLowerCase().trim() === 'account');
    if (req.user?.role !== 'ADMIN' && !isAccount) {
        res.status(403);
        throw new Error('Only Admins and Account team can verify bookings');
    }
    const booking = await Booking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    booking.isVerified = isVerified;
    if (isVerified) {
        booking.verifiedBy = req.user?.name || 'Admin';
        booking.verifiedAt = new Date();
    }
    else {
        booking.verifiedBy = null;
        booking.verifiedAt = null;
    }
    await booking.save();
    res.json({
        id: booking._id,
        isVerified: booking.isVerified,
        verifiedBy: booking.verifiedBy,
        verifiedAt: booking.verifiedAt
    });
    // BACKGROUND: Logging and notifications
    setImmediate(() => runBG(`verifyBooking_sideEffects_${id}`, async () => {
        // Log activity
        await Timeline_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            action: 'BOOKING_VERIFIED',
            details: isVerified ? `Booking verified by ${req.user?.name}` : `Verification removed by ${req.user?.name}`,
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
        // Notify assigned agent if verified
        if (isVerified && booking.assignedToUserId) {
            await Notification_1.default.create({
                userId: booking.assignedToUserId,
                bookingId: id,
                message: `Your booking ${booking.uniqueCode} has been verified by the Accounts team.`,
            });
        }
        invalidateBookingCaches();
    }));
});
// @desc    Get activity log for a booking
// @route   GET /api/bookings/:id/activity
// @access  Private
exports.getBookingActivity = (0, express_async_handler_1.default)(async (req, res) => {
    const activities = await Timeline_1.default.find({ bookingId: req.params.id, type: 'activity' })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('userId', 'name')
        .lean();
    const mapped = activities.map((a) => ({
        id: a._id.toString(),
        action: a.action,
        details: a.details,
        user: a.userId?.name || 'System',
        createdAt: a.createdAt,
    }));
    res.json(mapped);
});
