"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBooking = exports.getBookingActivity = exports.getCalendarBookings = exports.deletePayment = exports.getPayments = exports.addPayment = exports.updatePassengers = exports.addPassengers = exports.getComments = exports.addComment = exports.bulkDelete = exports.bulkAssign = exports.assignBooking = exports.updateBookingStatus = exports.updateBooking = exports.createBooking = exports.deleteBooking = exports.getBookingById = exports.getBookings = exports.getRecentBookings = exports.getBookingStats = void 0;
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
// Helper to clear all booking-related list caches (stats, recent, etc)
const invalidateBookingCaches = () => {
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('stats_');
    cache_1.default.invalidateByPrefix('recent_');
};
// Helper to recalculate and save outstanding balance on a booking
const recalcOutstanding = async (bookingId) => {
    const [payments, booking] = await Promise.all([
        Payment_1.default.find({ bookingId }).select('amount').lean(),
        Booking_1.default.findById(bookingId).select('totalAmount amount estimatedCosts').lean()
    ]);
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    if (booking) {
        let bookingTotal = booking.totalAmount || booking.amount || 0;
        if (booking.estimatedCosts && booking.estimatedCosts.length > 0) {
            bookingTotal = booking.estimatedCosts.reduce((sum, item) => sum + (item.price || 0), 0);
        }
        const outstanding = Math.max(bookingTotal - totalPaid, 0);
        await Booking_1.default.updateOne({ _id: bookingId }, { $set: { outstanding, amount: bookingTotal, totalAmount: bookingTotal } });
    }
};
// Helper to safely get string ID from potentially populated ObjectId field
const getObjectIdString = (field) => {
    if (!field)
        return null;
    return field._id?.toString() || field.toString();
};
// @desc    Get booking stats (counts only, no data)
exports.getBookingStats = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = `stats_${req.user?.id || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
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
    const result = stats.length > 0 ? {
        total: stats[0].total,
        booked: stats[0].booked,
        pending: stats[0].pending,
        working: stats[0].working,
        sent: stats[0].sent
    } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };
    cache_1.default.set(cacheKey, result, 300);
    res.json(result);
});
// @desc    Get recent bookings (lightweight, for dashboard)
exports.getRecentBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = `recent_${req.user?.id || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
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
        .select('uniqueCode status assignedToUserId contact destination travelDate amount createdAt travellers')
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedToUserId', 'name')
        .lean();
    const mapped = bookings.map(b => ({
        ...b,
        id: b._id.toString(),
        createdOn: b.createdAt,
        contactPerson: b.contact?.name,
        contactNumber: b.contact?.phone,
        bookingType: b.contact?.type === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        assignedToUser: b.assignedToUserId,
    }));
    cache_1.default.set(cacheKey, mapped, 60);
    res.json(mapped);
});
// @desc    Get all bookings (with filtering & pagination)
exports.getBookings = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '15', myBookings, outstandingOnly, group, cursor } = req.query;
    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${group || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${outstandingOnly || ''}_${page}_${limit}_${cursor || ''}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.json(cached);
        return;
    }
    const query = {};
    const userGroups = req.user?.groups || [];
    if (req.user?.role !== 'ADMIN') {
        const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
        const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';
        if (isAccount || isOperation) {
            query.status = 'Booked';
        }
        else if (req.user?.role === 'AGENT' || req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            query.$or = [
                { participantIds: new mongoose_1.default.Types.ObjectId(req.user.id) },
                { assignedGroup: { $in: userGroups } }
            ];
        }
        else if (req.user?.role === 'MARKETER') {
            query.participantIds = new mongoose_1.default.Types.ObjectId(req.user.id);
        }
    }
    if (myBookings === 'true') {
        const userId = new mongoose_1.default.Types.ObjectId(req.user?.id);
        if (query.$or) {
            const existingOr = query.$or;
            query.$and = [{ $or: existingOr }, { participantIds: userId }];
            delete query.$or;
        }
        else {
            query.participantIds = userId;
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
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const pageNum = Math.max(parseInt(page, 10), 1);
    const skipNum = cursor ? 0 : (pageNum - 1) * limitNum;
    if (cursor && mongoose_1.default.Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new mongoose_1.default.Types.ObjectId(cursor) };
    }
    const [total, rawBookings] = await Promise.all([
        cursor ? Promise.resolve(0) : Booking_1.default.countDocuments(query).maxTimeMS(2000),
        Booking_1.default.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate amount totalAmount travellers createdByUserId assignedToUserId contact outstanding createdAt lastInteractionAt')
            .sort({ _id: -1 })
            .skip(cursor ? 0 : skipNum)
            .limit(limitNum)
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .lean()
            .maxTimeMS(5000)
    ]);
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
    const totalPages = Math.ceil(total / limitNum);
    const result = {
        data: mappedBookings,
        nextCursor,
        meta: {
            total: cursor ? undefined : total,
            totalPages: cursor ? undefined : totalPages,
            page: pageNum,
            limit: limitNum,
            hasMore: !!nextCursor
        },
    };
    cache_1.default.set(cacheKey, result, 60);
    res.setHeader('X-Cache-Status', 'MISS');
    res.json(result);
});
// @desc    Get a single booking by ID
exports.getBookingById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid Booking ID');
    }
    const cacheKey = `booking_${id}`;
    const cached = cache_1.default.get(cacheKey);
    const checkAuth = (b) => {
        if (req.user?.role === 'ADMIN')
            return true;
        const creatorId = getObjectIdString(b.createdByUserId);
        const assignedId = getObjectIdString(b.assignedToUserId);
        const bookingGroup = b.assignedGroup || 'Package / LCC';
        const userGroups = req.user?.groups || [];
        if (req.user?.role === 'AGENT' || req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            return creatorId === String(req.user?.id) || assignedId === String(req.user?.id) || userGroups.includes(bookingGroup);
        }
        if (req.user?.role === 'MARKETER')
            return creatorId === String(req.user?.id);
        if (req.user?.role === 'OPERATION' || req.user?.role === 'ACCOUNT')
            return b.status === 'Booked';
        return false;
    };
    if (cached) {
        if (!checkAuth(cached)) {
            res.status(403);
            throw new Error('Not authorized to view this booking');
        }
        res.json(cached);
        return;
    }
    if (bookingFetchInFlight.has(id)) {
        const data = await bookingFetchInFlight.get(id);
        res.json(data);
        return;
    }
    const fetchPromise = (async () => {
        const [booking, allHistory, payments, passengers] = await Promise.all([
            Booking_1.default.findById(id).populate('assignedToUserId', 'name role').populate('createdByUserId', 'name role').lean(),
            Comment_1.default.find({ bookingId: id }).populate('userId', 'name role').sort({ createdAt: -1 }).lean(),
            Payment_1.default.find({ bookingId: id }).sort({ date: -1 }).lean(),
            Passenger_1.default.find({ bookingId: id }).lean()
        ]);
        if (!booking)
            return null;
        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const outstanding = (booking.amount || 0) - totalPaid;
        const unifiedTimeline = (allHistory || []).map((t) => {
            const agentName = t.userId?.name || (typeof t.userId === 'string' ? t.userId : 'User');
            const isActivity = t.type === 'activity';
            const rawText = t.text || t.details || '';
            // Format: "Agent Name : Message" (ensuring consistency)
            const formattedText = rawText.includes(' : ')
                ? rawText
                : `${agentName} : ${rawText}`;
            return {
                ...t,
                id: t._id?.toString(),
                type: t.type || 'comment',
                text: isActivity ? undefined : formattedText,
                details: isActivity ? formattedText : undefined,
                agentName: agentName
            };
        });
        const result = {
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
            timeline: unifiedTimeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            payments: payments,
            travelers: passengers,
            createdByUser: booking.createdByUserId,
            assignedToUser: booking.assignedToUserId,
        };
        return result;
    })();
    bookingFetchInFlight.set(id, fetchPromise);
    try {
        const result = await fetchPromise;
        if (!result) {
            res.status(404);
            throw new Error('Booking not found');
        }
        cache_1.default.set(cacheKey, result, 60);
        res.json(result);
    }
    finally {
        bookingFetchInFlight.delete(id);
    }
});
// @desc    Delete booking
exports.deleteBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id: bookingId } = req.params;
    const booking = await Booking_1.default.findById(bookingId).select('primaryContactId').lean();
    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }
    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Only Admins can delete bookings');
    }
    await Booking_1.default.deleteOne({ _id: bookingId });
    cache_1.default.del(`booking_${bookingId}`);
    invalidateBookingCaches();
    res.json({ message: 'Booking deleted successfully', id: bookingId });
    setImmediate(() => runBG(`deleteBooking_cleanup_${bookingId}`, async () => {
        await Promise.all([
            Comment_1.default.deleteMany({ bookingId }),
            Passenger_1.default.deleteMany({ bookingId }),
            Payment_1.default.deleteMany({ bookingId }),
            Notification_1.default.deleteMany({ bookingId }),
            booking.primaryContactId ? PrimaryContact_1.default.findByIdAndDelete(booking.primaryContactId) : Promise.resolve()
        ]);
        invalidateBookingCaches();
    }));
});
// @desc    Create booking
exports.createBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const result = types_1.createBookingSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const primaryContactId = new mongoose_1.default.Types.ObjectId();
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
    const booking = await Booking_1.default.create({
        primaryContactId,
        contact: {
            name: result.data.contactPerson,
            phone: result.data.contactNumber,
            email: result.data.contactEmail || null,
            type: result.data.bookingType === 'B2B' ? 'B2B' : 'B2C',
            requirements: result.data.requirements || null,
            interested: result.data.interested === 'Yes',
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
        participantIds: req.user?.id ? [new mongoose_1.default.Types.ObjectId(req.user.id)] : [],
        assignedGroup: result.data.assignedGroup || 'Package / LCC',
    });
    invalidateBookingCaches();
    res.status(201).json(booking);
    setImmediate(() => runBG(`createBooking_sideEffects_${booking._id}`, async () => {
        await Promise.all([
            PrimaryContact_1.default.create({
                _id: primaryContactId,
                contactName: result.data.contactPerson,
                contactPhoneNo: result.data.contactNumber,
                contactEmail: result.data.contactEmail || null,
                bookingType: result.data.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)',
                requirements: result.data.requirements || null,
                interested: result.data.interested === 'Yes',
            }),
            Comment_1.default.create({
                bookingId: booking._id,
                userId: req.user?.id,
                type: 'activity',
                text: `Booking created for ${booking.contact?.name || 'Customer'}`,
            }),
            Comment_1.default.create({
                bookingId: booking._id,
                userId: req.user?.id,
                type: 'activity',
                text: `Booking Assigned to ${booking.assignedGroup} by ${req.user?.name || 'System'}(${req.user?.groups?.[0] || 'Admin'})`,
            })
        ]);
    }));
});
// @desc    Update booking
exports.updateBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.updateBookingSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const updateData = { ...req.body, lastInteractionAt: new Date() };
    if (req.body.contactPerson)
        updateData['contact.name'] = req.body.contactPerson;
    if (req.body.contactNumber)
        updateData['contact.phone'] = req.body.contactNumber;
    if (req.body.requirements)
        updateData['contact.requirements'] = req.body.requirements;
    if (req.body.interested !== undefined)
        updateData['contact.interested'] = req.body.interested === 'Yes';
    if (req.body.bookingType)
        updateData['contact.type'] = req.body.bookingType;
    const updatedBooking = await Booking_1.default.findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' }).lean();
    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.json(updatedBooking);
    setImmediate(() => runBG(`updateBooking_sideEffects_${id}`, async () => {
        if (req.body.totalAmount !== undefined || req.body.estimatedCosts) {
            await recalcOutstanding(id);
        }
        if (updatedBooking.primaryContactId) {
            const legacyUpdate = {};
            if (req.body.contactPerson)
                legacyUpdate.contactName = req.body.contactPerson;
            if (req.body.contactNumber)
                legacyUpdate.contactPhoneNo = req.body.contactNumber;
            await PrimaryContact_1.default.findByIdAndUpdate(updatedBooking.primaryContactId, legacyUpdate);
        }
    }));
});
// @desc    Update status
exports.updateBookingStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.updateBookingStatusSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid status input');
    }
    const { status } = result.data;
    const booking = await Booking_1.default.findById(id).lean();
    const oldStatus = booking?.status;
    const updatedBooking = await Booking_1.default.findByIdAndUpdate(id, { status, lastInteractionAt: new Date() }, { returnDocument: 'after' }).lean();
    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.json(updatedBooking);
    setImmediate(() => runBG(`updateStatus_sideEffects_${id}`, async () => {
        await Comment_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            text: `Status updated from ${oldStatus} to ${status}`
        });
    }));
});
// @desc    Assign booking
exports.assignBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.assignBookingSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const { assignedToUserId } = result.data;
    const booking = await Booking_1.default.findById(id).lean();
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    const previousAssignedUserId = getObjectIdString(booking.assignedToUserId);
    const newAssignedUserId = assignedToUserId || null;
    if (previousAssignedUserId !== newAssignedUserId) {
        await Booking_1.default.updateOne({ _id: id }, { $set: { assignedToUserId: newAssignedUserId, participantIds: [booking.createdByUserId, newAssignedUserId].filter(Boolean) } });
        let previousAgentName = 'Unassigned';
        if (previousAssignedUserId) {
            const prevAgent = await User_1.default.findById(previousAssignedUserId).lean();
            previousAgentName = prevAgent?.name || 'Unassigned';
        }
        let newAgentName = 'Unassigned';
        let newAgentGroup = 'Admin';
        if (newAssignedUserId) {
            const newAgent = await User_1.default.findById(newAssignedUserId).lean();
            newAgentName = newAgent?.name || 'Unassigned';
            newAgentGroup = newAgent?.groups?.[0] || 'Admin';
        }
        await Comment_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            text: `Agent changed: ${previousAgentName} ➔ ${newAgentName}(${newAgentGroup})`
        });
    }
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.json({ message: 'Lead assigned successfully' });
});
// @desc    Bulk assign
exports.bulkAssign = (0, express_async_handler_1.default)(async (req, res) => {
    const { bookingIds, assignedToUserId } = req.body;
    const newAgentId = assignedToUserId || null;
    let newAgentName = 'Unassigned';
    if (newAgentId) {
        const newAgent = await User_1.default.findById(newAgentId).lean();
        newAgentName = newAgent?.name || 'Unknown';
    }
    await Booking_1.default.updateMany({ _id: { $in: bookingIds } }, { $set: { assignedToUserId: newAgentId, lastInteractionAt: new Date() } });
    setImmediate(async () => {
        for (const bId of bookingIds) {
            await Comment_1.default.create({ bookingId: bId, userId: req.user?.id, type: 'activity', text: `Bulk Assignment: Changed to ${newAgentName}` });
        }
        invalidateBookingCaches();
    });
    res.json({ message: 'Bulk assignment complete' });
});
// @desc    Bulk delete
exports.bulkDelete = (0, express_async_handler_1.default)(async (req, res) => {
    const { bookingIds } = req.body;
    const bookings = await Booking_1.default.find({ _id: { $in: bookingIds } }).lean();
    if (bookings.length > 0) {
        const validIds = bookings.map(b => b._id);
        await Promise.all([
            Comment_1.default.deleteMany({ bookingId: { $in: validIds } }),
            Passenger_1.default.deleteMany({ bookingId: { $in: validIds } }),
            Payment_1.default.deleteMany({ bookingId: { $in: validIds } }),
            Booking_1.default.deleteMany({ _id: { $in: validIds } })
        ]);
    }
    invalidateBookingCaches();
    res.json({ message: `Successfully deleted ${bookings.length} bookings` });
});
// @desc    Add comment
exports.addComment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const comment = await Comment_1.default.create({ bookingId: id, userId: req.user?.id, type: 'comment', text });
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.status(201).json(comment);
});
// @desc    Get comments
exports.getComments = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const comments = await Comment_1.default.find({ bookingId: id, type: 'comment' }).populate('userId', 'name role').sort({ createdAt: -1 }).lean();
    res.json(comments);
});
// @desc    Add passengers
exports.addPassengers = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const passengersData = inputData.map(p => ({ ...p, bookingId: id }));
    const createdPassengers = await Passenger_1.default.insertMany(passengersData);
    cache_1.default.del(`booking_${id}`);
    res.status(201).json(createdPassengers);
});
// @desc    Update passengers
exports.updatePassengers = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = types_1.createPassengersSchema.safeParse(inputData);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid passenger data');
    }
    await Passenger_1.default.deleteMany({ bookingId: id });
    const passengersData = result.data.map(p => ({ ...p, bookingId: id }));
    const createdPassengers = await Passenger_1.default.insertMany(passengersData);
    cache_1.default.del(`booking_${id}`);
    res.json(createdPassengers);
});
// @desc    Add payment
exports.addPayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = types_1.createPaymentSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid payment data');
    }
    const payment = await Payment_1.default.create({ ...result.data, bookingId: id });
    await recalcOutstanding(id);
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.status(201).json(payment);
});
// @desc    Get payments
exports.getPayments = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const payments = await Payment_1.default.find({ bookingId: id }).sort({ date: -1 }).lean();
    res.json(payments);
});
// @desc    Delete payment
exports.deletePayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id, paymentId } = req.params;
    await Payment_1.default.deleteOne({ _id: paymentId, bookingId: id });
    await recalcOutstanding(id);
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.json({ message: 'Payment removed successfully' });
});
// @desc    Get calendar bookings
exports.getCalendarBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);
    const query = { travelDate: { $gte: startDate, $lte: endDate } };
    if (req.user?.role === 'AGENT')
        query.assignedToUserId = req.user.id;
    const bookings = await Booking_1.default.find(query).select('uniqueCode status destination travelDate contact').lean();
    const events = bookings.map(b => ({
        id: b._id.toString(),
        title: b.contact?.name || b.uniqueCode || 'Booking',
        date: b.travelDate,
        status: b.status,
        destination: b.destination || '',
    }));
    res.json(events);
});
// @desc    Get booking activity
exports.getBookingActivity = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const activities = await Comment_1.default.find({ bookingId: id, type: 'activity' })
        .populate('userId', 'name role')
        .sort({ createdAt: -1 })
        .lean();
    const mapped = activities.map(a => ({
        id: a._id.toString(),
        action: 'ACTIVITY',
        details: a.text,
        user: a.userId?.name || 'System',
        createdAt: a.createdAt,
    }));
    res.json(mapped);
});
// @desc    Verify booking
exports.verifyBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking_1.default.findByIdAndUpdate(id, {
        isVerified: true,
        verifiedBy: req.user?.name || 'Admin',
        verifiedAt: new Date()
    }, { returnDocument: 'after' }).lean();
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    setImmediate(() => runBG(`verifyBooking_${id}`, async () => {
        await Comment_1.default.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            text: `Booking verified by ${req.user?.name || 'System'}`
        });
    }));
    cache_1.default.del(`booking_${id}`);
    invalidateBookingCaches();
    res.json(booking);
});
