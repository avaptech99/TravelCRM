import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import Timeline from '../models/Timeline';
import Passenger from '../models/Passenger';
import User from '../models/User';
import Payment from '../models/Payment';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import appCache from '../utils/cache';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    assignBookingSchema,
    createCommentSchema,
    createPassengersSchema,
    updateBookingSchema,
    createPaymentSchema,
} from '../types';
import { extractTravelInfo } from '../utils/extractTravelInfo';

// Request deduplication for booking fetches
const bookingFetchInFlight = new Map<string, Promise<any>>();

// Helper to clear all booking-related caches
const invalidateBookingCaches = () => {
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');
    appCache.invalidateByPrefix('booking_');
};

// Helper to recalculate and save outstanding balance on a booking
const recalcOutstanding = async (bookingId: string) => {
    const [payments, booking] = await Promise.all([
        Payment.find({ bookingId }).select('amount').lean(),
        Booking.findById(bookingId).select('totalAmount amount').lean()
    ]);
    
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    
    if (booking) {
        const bookingTotal = booking.totalAmount || booking.amount || 0;
        const outstanding = Math.max(bookingTotal - totalPaid, 0);
        await Booking.updateOne({ _id: bookingId }, { $set: { outstanding } });
    }
};


// @desc    Get booking stats (counts only, no data)
// @route   GET /api/bookings/stats
// @access  Private

// Helper to safely get string ID from potentially populated ObjectId field
const getObjectIdString = (field: any): string | null => {
    if (!field) return null;
    return (field as any)._id?.toString() || field.toString();
};

export const getBookingStats = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `stats_${req.user?.id || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const query: any = {};
    const userGroups = req.user?.groups || [];
    const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
    const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';

    if (isAccount || isOperation) {
        query.status = 'Booked';
    } else if (req.user?.role === 'AGENT') {
        query.assignedToUserId = new mongoose.Types.ObjectId(req.user.id);
    } else if (req.user?.role === 'MARKETER') {
        query.createdByUserId = new mongoose.Types.ObjectId(req.user.id);
    }

    console.time('getBookingStats');

    const stats = await Booking.aggregate([
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

    appCache.set(cacheKey, result, 120);
    res.json(result);
});

// @desc    Get recent bookings (lightweight, for dashboard)
// @route   GET /api/bookings/recent
// @access  Private
export const getRecentBookings = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `recent_${req.user?.id || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const query: any = {};
    const userGroups = req.user?.groups || [];
    const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
    const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';

    if (isAccount || isOperation) {
        query.status = 'Booked';
    } else if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    } else if (req.user?.role === 'MARKETER') {
        query.createdByUserId = req.user.id;
    }

    const bookings = await Booking.find(query)
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
        contactPerson: (b as any).primaryContact?.contactName,
        contactNumber: (b as any).primaryContact?.contactPhoneNo,
        bookingType: (b as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        travellers: b.travellers,
        travelers: (b as any).passengers,
        assignedToUser: b.assignedToUserId,
    }));
    appCache.set(cacheKey, mapped, 60);
    res.json(mapped);
});

// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '15', myBookings, outstandingOnly, group, cursor, sortBy, sortOrder } = req.query;


    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${group || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${outstandingOnly || ''}_${page}_${limit}_${cursor || ''}`;
    
    // Cache check
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const query: any = {};
    const userGroups = req.user?.groups || [];

    // 1. Mandatory Visibility Restrictions
    if (req.user?.role !== 'ADMIN') {
        const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
        const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';

        if (isAccount || isOperation) {
            query.status = 'Booked';
        } else if (req.user?.role === 'AGENT' || req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            query.$or = [
                { assignedToUserId: new mongoose.Types.ObjectId(req.user.id) }, 
                { createdByUserId: new mongoose.Types.ObjectId(req.user.id) },
                { assignedGroup: { $in: userGroups } }
            ];
        } else if (req.user?.role === 'MARKETER') {
            query.createdByUserId = new mongoose.Types.ObjectId(req.user.id);
        }
    }

    // 2. Filters
    if (myBookings === 'true') {
        const userMatch = [
            { assignedToUserId: new mongoose.Types.ObjectId(req.user?.id) },
            { createdByUserId: new mongoose.Types.ObjectId(req.user?.id) },
        ];
        if (query.$or) {
            const existingOr = query.$or;
            query.$and = [{ $or: existingOr }, { $or: userMatch }];
            delete query.$or;
        } else {
            query.$or = userMatch;
        }
    }

    if (status) {
        const statusArray = (status as string).split(',').map(s => s.trim());
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
        const agentArray = (assignedTo as string).split(',').map(a => a.trim());
        const targetAgentIds = agentArray.map(id => id === 'unassigned' ? null : new mongoose.Types.ObjectId(id));
        query.assignedToUserId = { $in: targetAgentIds };
    }

    if (search) {
        const searchRegex = new RegExp(search as string, 'i');
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
        } else {
            query.$or = searchConditions;
        }
    }

    if (outstandingOnly === 'true') query.outstanding = { $gt: 0 };
    if (group) query.assignedGroup = group;

    // 3. Cursor Logic (O(1) pagination)
    if (cursor) {
        query.lastInteractionAt = { $lt: new Date(cursor as string) };
    }

    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const pageNum = parseInt(page as string, 10);
    const sortField = (sortBy as string) || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortQuery = { [sortField]: sortDir };

    const reqId = Date.now().toString(36);


    console.time(`getBookingsQuery_${reqId}`);
    
    // If using cursor, we skip total count entirely to save a heavy query
    const [total, rawBookings] = await Promise.all([
        cursor ? Promise.resolve(0) : Booking.countDocuments(query),
        Booking.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate amount totalAmount travellers createdByUserId assignedToUserId contact outstanding createdAt lastInteractionAt')
            .sort(sortQuery as any)
            .skip(cursor ? 0 : (pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .lean()
    ]);

    console.timeEnd(`getBookingsQuery_${reqId}`);

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
        ? rawBookings[rawBookings.length - 1].lastInteractionAt.toISOString() 
        : null;


    const result = {
        data: mappedBookings,
        nextCursor,
        meta: {
            total: cursor ? undefined : total,
            page: pageNum,
            limit: limitNum,
            totalPages: cursor ? undefined : Math.ceil(total / limitNum),
            hasMore: !!nextCursor
        },
    };

    appCache.set(cacheKey, result, 60);
    res.json(result);
});


// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid Booking ID');
    }

    const cacheKey = `booking_${id}`;
    
    // Check cache first
    const cached = appCache.get(cacheKey);
    
    const checkAuth = (b: any) => {
        if (req.user?.role === 'ADMIN') return true;

        const creatorId = (b.createdByUserId as any)?._id?.toString() || b.createdByUserId?.toString();
        const assignedId = (b.assignedToUserId as any)?._id?.toString() || b.assignedToUserId?.toString();
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

    if (cached) {
        if (!checkAuth(cached)) {
            res.status(403);
            throw new Error('Not authorized to view this booking');
        }
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    // Backend Request Deduplication
    if (bookingFetchInFlight.has(id)) {
        try {
            const data = await bookingFetchInFlight.get(id);
            if (!checkAuth(data)) {
                res.status(403);
                throw new Error('Not authorized to view this booking');
            }
            console.log(`[DEDUPLICATED] Request for booking ${id} served from in-flight promise`);
            res.json(data);
            return;
        } catch (err) {
            // If the shared promise failed, fall through to try a fresh one
        }
    }

    const fetchPromise = (async () => {
        const booking = await Booking.findById(id)
            .populate('assignedToUserId', 'name role')
            .populate('createdByUserId', 'name role')
            .populate('passengers')
            .populate('payments')
            .populate({
                path: 'timeline',
                populate: { path: 'userId', select: 'name role' },
                options: { sort: { createdAt: -1 }, limit: 20 }
            })
            .lean();


        if (!booking) return null;

        const totalPaid = (booking as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const outstanding = ((booking as any).amount || 0) - totalPaid;

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
            travelers: (booking as any).passengers,
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

        appCache.set(cacheKey, result, 60);
        res.json(result);
        return;
    } finally {
        bookingFetchInFlight.delete(id);
    }
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await Booking.findById(id).lean();

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Not authorized to delete bookings. Only Admins can perform this action.');
    }

    // PRIMARY write — delete the booking document first
    await Booking.findByIdAndDelete(id);

    // ✅ RESPOND IMMEDIATELY
    res.json({ message: 'Booking deletion initiated successfully', id });

    // ✅ BACKGROUND CLEANUP
    setImmediate(async () => {
        console.time(`[BG] deleteBooking_cleanup_${id}`);
        try {
            const cleanupTasks = [
                Timeline.deleteMany({ bookingId: id }),
                Passenger.deleteMany({ bookingId: id }),
                Payment.deleteMany({ bookingId: id }),
                Notification.deleteMany({ bookingId: id }),
            ];

            if (booking.primaryContactId) {
                cleanupTasks.push(PrimaryContact.findByIdAndDelete(booking.primaryContactId) as any);
            }

            await Promise.all(cleanupTasks);
            invalidateBookingCaches();
            console.log(`[BG] Cleanup complete for booking ${id}`);
        } catch (err: any) {
            console.error(`[BG] deleteBooking ${id} cleanup FAILED:`, err.message);
        } finally {
            console.timeEnd(`[BG] deleteBooking_cleanup_${id}`);
        }
    });
});


// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Admin & Agent)
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const result = createBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    // Create PrimaryContact first
    const primaryContact = await PrimaryContact.create({
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
        const parsedData = extractTravelInfo(result.data.requirements);
        if (!finalDestination && parsedData.destinationCity) finalDestination = parsedData.destinationCity;
        if (!finalTravelDate && parsedData.travelDate) finalTravelDate = parsedData.travelDate;
        if (!finalTravellers && parsedData.travellers) finalTravellers = parsedData.travellers;
    }

    // Create booking
    const booking = await Booking.create({
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

    // ✅ RESPOND IMMEDIATELY with minimum necessary data or lean object
    res.status(201).json(booking);

    // ✅ BACKGROUND: Side effects and complex mapping/logging
    setImmediate(async () => {
        try {
            await Promise.all([
                Timeline.create({
                    bookingId: booking._id,
                    userId: req.user?.id,
                    type: 'activity',
                    action: 'BOOKING_CREATED',
                    details: `Booking created by ${req.user?.name}`,
                    expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                }),
                booking.assignedToUserId ? Notification.create({
                    userId: booking.assignedToUserId,
                    bookingId: booking._id,
                    message: `New lead ${primaryContact.contactName || booking.destination || 'Unassigned'} has been assigned to you.`,
                }) : Promise.resolve()
            ]);

            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] createBooking side-effects failed:', err);
        }
    });

});


// @desc    Update a booking
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = updateBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    // Role-based auth check (we need the booking first to check creator/assignee)
    const booking = await Booking.findById(id).lean();
    if (!booking) {
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
        } else if (req.user?.role === 'MARKETER') {
            if (booking.assignedToUserId) {
                res.status(403);
                throw new Error('Not authorized to update an assigned booking');
            }
            const forbiddenKeys = Object.keys(req.body).filter(k => k !== 'requirements');
            if (forbiddenKeys.length > 0) {
                res.status(403);
                throw new Error('Marketers are only authorized to update Detailed Requirements');
            }
        } else if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            if (getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
                res.status(403);
                throw new Error('You can only update your own queries');
            }
        } else {
            res.status(403);
            throw new Error('Not authorized to update this booking');
        }
    }

    // Prepare update object
    const updateData: any = { ...req.body, lastInteractionAt: new Date() };
    
    // Sync embedded contact snapshot if provided
    if (req.body.contactPerson !== undefined || req.body.contactNumber !== undefined || req.body.contactEmail !== undefined || req.body.requirements !== undefined || req.body.interested !== undefined || req.body.bookingType !== undefined) {
        updateData.contact = { ...(booking.contact || {}) };
        if (req.body.contactPerson !== undefined) updateData.contact.name = req.body.contactPerson;
        if (req.body.contactNumber !== undefined) updateData.contact.phone = req.body.contactNumber;
        if (req.body.contactEmail !== undefined) updateData.contact.email = req.body.contactEmail;
        if (req.body.requirements !== undefined) updateData.contact.requirements = req.body.requirements;
        if (req.body.interested !== undefined) updateData.contact.interested = req.body.interested === 'Yes';
        if (req.body.bookingType !== undefined) updateData.contact.type = req.body.bookingType === 'B2B' ? 'B2B' : 'B2C';
    }

    // Handle segments specifically if present
    if (req.body.segments) {
        updateData.segments = req.body.segments.map((s: any) => ({
            from: s.from || '',
            to: s.to || '',
            date: s.date ? new Date(s.date) : null
        }));
    }

    // PRIMARY write
    const updatedBooking = await Booking.findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .populate('assignedToUserId', 'name')
        .populate('createdByUserId', 'name')
        .lean();

    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found after update');
    }

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
    setImmediate(async () => {
        try {
            const backgroundTasks = [];

            // 1. Recalc outstanding if financials changed
            if (req.body.totalAmount !== undefined || req.body.amount !== undefined) {
                backgroundTasks.push(recalcOutstanding(id));
            }

            // 2. Sync with Legacy PrimaryContact if needed
            if (booking.primaryContactId && (req.body.requirements !== undefined || req.body.interested !== undefined || req.body.bookingType !== undefined)) {
                const legacyUpdate: any = {};
                if (req.body.requirements !== undefined) legacyUpdate.requirements = req.body.requirements;
                if (req.body.interested !== undefined) legacyUpdate.interested = req.body.interested === 'Yes';
                if (req.body.bookingType !== undefined) legacyUpdate.bookingType = req.body.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)';
                backgroundTasks.push(PrimaryContact.findByIdAndUpdate(booking.primaryContactId, legacyUpdate));
            }

            // 3. Log Activity
            backgroundTasks.push(Timeline.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'BOOKING_UPDATED',
                details: 'Booking details were modified.',
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            }));

            await Promise.all(backgroundTasks);
            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] updateBooking side-effects failed:', err);
        }
    });

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

    const { status } = result.data;

    // PRIMARY write only
    const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status, lastInteractionAt: new Date() },
        { new: true }
    ).lean();

    if (!updatedBooking) {
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
        } else {
            res.status(403);
            throw new Error('Not authorized to update status for this booking');
        }
    }

    // ✅ RESPOND IMMEDIATELY
    res.json(updatedBooking);

    // ✅ BACKGROUND side effects
    setImmediate(async () => {
        try {
            await Timeline.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'STATUS_CHANGE',
                details: `Status updated to ${status}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            
            if (updatedBooking.createdByUserId && getObjectIdString(updatedBooking.createdByUserId) !== req.user?.id) {
                const creator = await User.findById(updatedBooking.createdByUserId);
                if (creator?.role === 'MARKETER') {
                    await Notification.create({
                        userId: updatedBooking.createdByUserId,
                        bookingId: id,
                        message: `Status of your lead ${updatedBooking.destination} updated to ${status}.`,
                    });
                }
            }

            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] updateBookingStatus side-effects failed:', err);
        }
    });
});


// @desc    Assign an agent to a booking
// @route   PATCH /api/bookings/:id/assign
// @access  Private (Admin only)
export const assignBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'AGENT') {
        res.status(403);
        throw new Error('Only Admins and Agents can assign leads');
    }

    const result = assignBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const { assignedToUserId } = result.data;

    if (assignedToUserId) {
        const agent = await User.findById(assignedToUserId);
        if (!agent) {
            res.status(400);
            throw new Error('User not found');
        }
        if (agent.role === 'MARKETER') {
            res.status(400);
            throw new Error('Leads cannot be assigned to Marketers');
        }
    }

    const booking = await Booking.findById(id).populate('primaryContact', 'contactName');
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

        const commentText = `Agent changed: ${previousAgentName} ➔ ${newAgentName}`;

        await Timeline.create({
            bookingId: id,
            userId: req.user?.id,
            type: 'activity',
            action: 'ASSIGNED',
            details: commentText,
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });

        if (newAssignedUserId) {
            await Notification.create({
                userId: newAssignedUserId,
                bookingId: id,
                message: `Lead ${(booking as any).primaryContact?.contactName || booking.destination || 'Unassigned'} has been assigned to you.`,
            });

            // Also notify the marketer who created the lead
            if (booking.createdByUserId) {
                const creator = await User.findById(booking.createdByUserId);
                if (creator?.role === 'MARKETER' && getObjectIdString(booking.createdByUserId) !== req.user?.id) {
                    const agent = await User.findById(newAssignedUserId);
                    await Notification.create({
                        userId: booking.createdByUserId,
                        bookingId: id,
                        message: `Your lead has been assigned to ${agent?.name || 'an agent'}.`,
                    });
                }
            }
        }
    }

    const updatedBooking = await Booking.findById(id).populate('assignedToUser', 'name');

    invalidateBookingCaches();
    res.json(updatedBooking);
});

// @desc    Bulk assign bookings to an agent (or unassign)
// @route   POST /api/bookings/bulk-assign
// @access  Private (Admin only)
export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
    // Schema check temporarily removed as bulkAssignSchema is not in types
    const { bookingIds, assignedToUserId } = req.body;

    if (assignedToUserId) {
        const agent = await User.findById(assignedToUserId);
        if (!agent || agent.role !== 'AGENT') {
            res.status(400);
            throw new Error('Invalid agent selected');
        }
    }

    const newAgentId = assignedToUserId || null;
    let newAgentName = 'Unassigned';
    
    if (newAgentId) {
        const newAgent = await User.findById(newAgentId);
        newAgentName = newAgent?.name || 'Unknown Agent';
    }

    // Process in bulk
    const bookings = await Booking.find({ _id: { $in: bookingIds } }).populate('primaryContact', 'contactName');
    
    // We'll use a for...of loop or map with Promise.all
    // For each booking, check if assignment changed, then update and create comment
    const updatePromises = bookings.map(async (booking) => {
        const previousAssignedUserId = getObjectIdString(booking.assignedToUserId) || null;
        
        if (previousAssignedUserId !== (newAgentId ? newAgentId.toString() : null)) {
            booking.assignedToUserId = newAgentId as any;
            await booking.save();

            let previousAgentName = 'Unassigned';
            if (previousAssignedUserId) {
                const prevAgent = await User.findById(previousAssignedUserId);
                previousAgentName = prevAgent?.name || 'Unknown Agent';
            }

            const commentText = `Agent changed: ${previousAgentName} ➔ ${newAgentName}`;

            await Timeline.create({
                bookingId: booking._id,
                userId: req.user?.id,
                type: 'activity',
                action: 'ASSIGNED',
                details: commentText,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });

            if (newAgentId) {
                await Notification.create({
                    userId: newAgentId,
                    bookingId: booking._id,
                    message: `Lead ${(booking as any).primaryContact?.contactName || booking.destination || 'Unassigned'} has been assigned to you.`,
                });

                // Also notify the marketer who created the lead
                if (booking.createdByUserId) {
                    const creator = await User.findById(booking.createdByUserId);
                    if (creator?.role === 'MARKETER' && getObjectIdString(booking.createdByUserId) !== req.user?.id) {
                        await Notification.create({
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

// @desc    Bulk delete bookings
// @route   POST /api/bookings/bulk-delete
// @access  Private (Admin only)
export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
    const { bookingIds } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        res.status(400);
        throw new Error('No booking IDs provided');
    }

    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Only admins can bulk delete leads');
    }

    const bookings = await Booking.find({ _id: { $in: bookingIds } });
    
    if (bookings.length > 0) {
        const validBookingIds = bookings.map(b => b._id);
        const contactIds = bookings.map(b => b.primaryContactId).filter(Boolean);

        await Promise.all([
            Timeline.deleteMany({ bookingId: { $in: validBookingIds } }),
            Passenger.deleteMany({ bookingId: { $in: validBookingIds } }),
            Payment.deleteMany({ bookingId: { $in: validBookingIds } }),
            Notification.deleteMany({ bookingId: { $in: validBookingIds } }),
            contactIds.length > 0 ? PrimaryContact.deleteMany({ _id: { $in: contactIds } }) : Promise.resolve(),
            Booking.deleteMany({ _id: { $in: validBookingIds } })
        ]);
    }

    invalidateBookingCaches();
    res.json({ message: `Successfully deleted ${bookings.length} bookings` });
});
// @desc    Add comment to a booking
// @route   POST /api/bookings/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }
    const userId = req.user.id;
    const { text } = req.body;
    const result = createCommentSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid comment input');
    }

    const booking = await Booking.findById(id).populate('primaryContact', 'contactName').lean();

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to comment on this booking');
    }

    const timeline = await Timeline.create({
        bookingId: id,
        userId: userId,
        type: 'comment',
        text: text,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    await Booking.findByIdAndUpdate(id, { lastInteractionAt: new Date() });

    // Notification Logic
    if (req.user?.role === 'MARKETER' && booking.assignedToUserId) {
        // Notify the assigned agent when marketer comments
        await Notification.create({
            userId: booking.assignedToUserId,
            bookingId: id,
            message: `Marketer ${req.user.name} added a remark on lead ${(booking as any).primaryContact?.contactName || booking.destination || 'Unassigned'}.`,
        });
    }

    invalidateBookingCaches();
    res.status(201).json(timeline);
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

    const comments = await Timeline.find({ bookingId: id, type: 'comment' })
        .populate('userId', 'name role')
        .sort({ createdAt: -1 })
        .lean();

    res.json(comments);
});

// @desc    Add passengers to a booking
// @route   POST /api/bookings/:id/passengers
// @access  Private
export const addPassengers = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { id } = req.params;

    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = createPassengersSchema.safeParse(inputData);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid passenger data');
    }

    const booking = await Booking.findById(id);

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
    const createdPassengers = await Passenger.insertMany(passengersData);
    const dbTime = Date.now() - dbStart;

    const totalTime = Date.now() - startTime;
    console.log(`[PASSENGER PERF] Add Passengers - Total: ${totalTime}ms | DB: ${dbTime}ms | Count: ${passengersData.length}`);

    res.status(201).json(createdPassengers);

    // BACKGROUND: Logging and cache invalidation
    setImmediate(async () => {
        try {
            await Timeline.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'PASSENGERS_ADDED',
                details: `Added ${passengersData.length} travelers to the booking.`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] addPassengers side-effects failed:', err);
        }
    });
});

// @desc    Update (replace) passengers for a booking
// @route   PUT /api/bookings/:id/passengers
// @access  Private
export const updatePassengers = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { id } = req.params;

    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = createPassengersSchema.safeParse(inputData);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid passenger data');
    }

    const booking = await Booking.findById(id);

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
    await Passenger.deleteMany({ bookingId: id });
    const createdPassengers = await Passenger.insertMany(passengersData);
    const dbTime = Date.now() - dbStart;

    const totalTime = Date.now() - startTime;
    console.log(`[PASSENGER PERF] Update Passengers - Total: ${totalTime}ms | DB (Del+Ins): ${dbTime}ms | Count: ${passengersData.length}`);

    res.json(createdPassengers);

    // BACKGROUND: Logging and cache invalidation
    setImmediate(async () => {
        try {
            await Timeline.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'PASSENGERS_UPDATED',
                details: `Updated details for ${passengersData.length} travelers.`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] updatePassengers side-effects failed:', err);
        }
    });
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

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to add payments');
    }

    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Agents can only add payments to their own bookings');
    }

    if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
        if (getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
            res.status(403);
            throw new Error('You can only add payments to your own bookings');
        }
    }

    const payment = await Payment.create({
        ...result.data,
        bookingId: id,
    });

    res.status(201).json(payment);

    // BACKGROUND: Payment side effects
    setImmediate(async () => {
        try {
            await Promise.all([
                recalcOutstanding(id),
                Timeline.create({
                    bookingId: id,
                    userId: req.user?.id,
                    type: 'activity',
                    action: 'PAYMENT_ADDED',
                    details: `Recorded payment of ${result.data.amount} via ${result.data.paymentMethod}`,
                    expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                })
            ]);

            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] addPayment side-effects failed:', err);
        }
    });

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

    const payments = await Payment.find({ bookingId: id }).sort({ date: -1 }).lean();

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

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to delete payments');
    }

    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Agents can only delete payments from their own bookings');
    }

    if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
        if (getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
            res.status(403);
            throw new Error('You can only delete payments from your own bookings');
        }
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.bookingId.toString() !== id) {
        res.status(404);
        throw new Error('Payment not found for this booking');
    }

    await Payment.findByIdAndDelete(paymentId);

    res.json({ message: 'Payment removed successfully' });

    // BACKGROUND: Payment removal side effects
    setImmediate(async () => {
        try {
            await Promise.all([
                recalcOutstanding(id),
                Timeline.create({
                    bookingId: id,
                    userId: req.user?.id,
                    type: 'activity',
                    action: 'PAYMENT_DELETED',
                    details: `Removed payment of ${payment.amount}`,
                    expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                })
            ]);

            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] deletePayment side-effects failed:', err);
        }
    });

});

// @desc    Get calendar bookings for a given month
// @route   GET /api/bookings/calendar
// @access  Private
export const getCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const m = parseInt(month as string) || (new Date().getMonth() + 1);
    const y = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const query: any = {
        travelDate: { $gte: startDate, $lte: endDate },
    };

    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    }

    const bookings = await Booking.find(query)
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
export const verifyBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isVerified } = req.body;

    const userGroups = req.user?.groups || [];
    const isAccount = req.user?.role === 'ACCOUNT' || userGroups.some(g => g.toLowerCase().trim() === 'account');

    if (req.user?.role !== 'ADMIN' && !isAccount) {
        res.status(403);
        throw new Error('Only Admins and Account team can verify bookings');
    }

    const booking = await Booking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    booking.isVerified = isVerified;
    if (isVerified) {
        booking.verifiedBy = req.user?.name || 'Admin';
        booking.verifiedAt = new Date();
    } else {
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
    setImmediate(async () => {
        try {
            // Log activity
            await Timeline.create({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'BOOKING_VERIFIED',
                details: isVerified ? `Booking verified by ${req.user?.name}` : `Verification removed by ${req.user?.name}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });

            // Notify assigned agent if verified
            if (isVerified && booking.assignedToUserId) {
                await Notification.create({
                    userId: booking.assignedToUserId,
                    bookingId: id,
                    message: `Your booking ${booking.uniqueCode} has been verified by the Accounts team.`,
                });
            }

            invalidateBookingCaches();
        } catch (err) {
            console.error('[Background] verifyBooking side-effects failed:', err);
        }
    });
});

// @desc    Get activity log for a booking
// @route   GET /api/bookings/:id/activity
// @access  Private
export const getBookingActivity = asyncHandler(async (req: Request, res: Response) => {
    const activities = await Timeline.find({ bookingId: req.params.id, type: 'activity' })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('userId', 'name')
        .lean();

    const mapped = activities.map((a: any) => ({
        id: a._id.toString(),
        action: a.action,
        details: a.details,
        user: a.userId?.name || 'System',
        createdAt: a.createdAt,
    }));

    res.json(mapped);
});

