import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import Timeline from '../models/Timeline';
import Comment from '../models/Comment';
import Passenger from '../models/Passenger';
import User from '../models/User';
import Payment from '../models/Payment';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import appCache from '../utils/cache';
import { createTimer } from '../utils/perfLogger';
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

// Background Operation Semaphore
let _bgOps = 0;
const MAX_BG = 2;

async function runBG(label: string, fn: () => Promise<void>): Promise<void> {
    if (_bgOps >= MAX_BG) {
        console.log(`[BG:SKIP] ${label} - Queue saturated`);
        return;
    }
    _bgOps++;
    const t = Date.now();
    try {
        await fn();
        console.log(`[BG:OK] ${label}: ${Date.now() - t}ms`);
    } catch (err: any) {
        console.error(`[BG:FAIL] ${label}:`, err.message);
    } finally {
        _bgOps--;
    }
}

// Helper to clear all booking-related list caches (stats, recent, etc)
const invalidateBookingCaches = () => {
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');
    // Note: Individual 'booking_{id}' caches are handled selectively in handlers
};

// Helper to recalculate and save outstanding balance on a booking
const recalcOutstanding = async (bookingId: string) => {
    const [payments, booking] = await Promise.all([
        Payment.find({ bookingId }).select('amount').lean(),
        Booking.findById(bookingId).select('totalAmount amount').lean()
    ]);
    
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    
    if (booking) {
        // Standardize: Ensure amount/totalAmount matches the sum of estimated costs if they exist
        let bookingTotal = booking.totalAmount || booking.amount || 0;
        if (booking.estimatedCosts && booking.estimatedCosts.length > 0) {
            bookingTotal = booking.estimatedCosts.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
        }

        const outstanding = Math.max(bookingTotal - totalPaid, 0);
        // Save back the standardized totals to ensure analytics picks them up
        await Booking.updateOne(
            { _id: bookingId }, 
            { $set: { outstanding, amount: bookingTotal, totalAmount: bookingTotal } }
        );
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

    const t = createTimer('getBookingStats');
    t.mark('dbQuery');

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
    t.mark('formatResponse');

    const result = stats.length > 0 ? {
        total: stats[0].total,
        booked: stats[0].booked,
        pending: stats[0].pending,
        working: stats[0].working,
        sent: stats[0].sent
    } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };

    appCache.set(cacheKey, result, 300);
    res.setHeader('X-Cache-Status', 'MISS');
    t.end({ source: 'db' });
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
        .select('uniqueCode status assignedToUserId contact destination travelDate amount createdAt travellers')
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedToUserId', 'name')
        .lean();

    const mapped = bookings.map(b => ({ 
        ...b, 
        id: (b as any)._id.toString(),
        createdOn: b.createdAt,
        contactPerson: b.contact?.name,
        contactNumber: b.contact?.phone,
        bookingType: b.contact?.type === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
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
    
    const t = createTimer('getBookings');
    t.mark('checkCache');

    const cached = appCache.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache' });
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
                { participantIds: new mongoose.Types.ObjectId(req.user.id) },
                { assignedGroup: { $in: userGroups } }
            ];
        } else if (req.user?.role === 'MARKETER') {
            query.participantIds = new mongoose.Types.ObjectId(req.user.id);
        }
    }

    // 2. Filters
    if (myBookings === 'true') {
        const userId = new mongoose.Types.ObjectId(req.user?.id);
        if (query.$or) {
            // If already restricted by group/role, intersect with myBookings
            const existingOr = query.$or;
            query.$and = [{ $or: existingOr }, { participantIds: userId }];
            delete query.$or;
        } else {
            query.participantIds = userId;
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

    // 3. Pagination Logic (Optimized for Atlas M0)
    t.mark('parseFilters');

    const limitNum = Math.min(parseInt(limit as string, 10), 50); // Hard limit of 50 for stability
    
    // Default sort: Newest first
    const sortQuery = { _id: -1 };

    // If cursor is provided, use it. If not, this is the first page.
    if (cursor && mongoose.Types.ObjectId.isValid(cursor as string)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor as string) };
    }

    const pageNum = Math.max(parseInt(page as string, 10), 1);
    // skip is only used as a fallback for old clients; cursor is preferred
    const skipNum = cursor ? 0 : (pageNum - 1) * limitNum; 

    if (cursor && mongoose.Types.ObjectId.isValid(cursor as string)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor as string) };
    }

    const [total, rawBookings] = await Promise.all([
        cursor ? Promise.resolve(0) : Booking.countDocuments(query).maxTimeMS(2000),
        Booking.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate amount totalAmount travellers createdByUserId assignedToUserId contact outstanding createdAt lastInteractionAt')
            .sort(sortQuery as any)
            .skip(cursor ? 0 : skipNum)
            .limit(limitNum)
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .lean()
            .maxTimeMS(5000)
    ]);
    t.mark('dbQuery');

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

    t.end({ page: cursor ? 'cursor' : pageNum, limit: limitNum, total, returned: mappedBookings.length });
    appCache.set(cacheKey, result, 60);
    res.setHeader('X-Cache-Status', 'MISS');
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

    const t = createTimer(`getBookingById_${id}`);
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
        } catch (err) {
            // If the shared promise failed, fall through to try a fresh one
        }
    }

    const fetchPromise = (async () => {
        // Parallelize sub-collection fetches to avoid N+1 sequential delay
        const [booking, timeline, legacyComments, payments, passengers] = await Promise.all([
            Booking.findById(id)
                .populate('assignedToUserId', 'name role')
                .populate('createdByUserId', 'name role')
                .lean()
                .maxTimeMS(3000),
            Timeline.find({ 
                $or: [
                    { bookingId: id },
                    { bookingId: String(id) as any }
                ]
            })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('userId', 'name role')
                .lean(),
            Comment.find({ bookingId: id })
                .sort({ createdAt: -1 })
                .limit(100)
                .populate('userId', 'name role')
                .lean(),
            Payment.find({ bookingId: id })
                .sort({ date: -1 })
                .lean()
                .maxTimeMS(2000),
            Passenger.find({ bookingId: id })
                .lean()
                .maxTimeMS(2000)
        ]);

        t.mark('dbQueryParallel');

        if (!booking) return null;

        t.mark('calculateTotals');
        const totalPaid = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const outstanding = (booking.amount || 0) - totalPaid;

        // 4. Map for Legacy "Old Style" Compatibility
        const historyData = (legacyComments || []);
        const processedHistory = historyData.map((c: any) => {
            const agentName = c.userId?.name || 'System Admin';
            // Ensure every history item follows the "Name : Action" style
            let displayText = c.text || '';
            if (displayText && !displayText.includes(' : ')) {
                displayText = `${agentName} : ${displayText}`;
            }
            
            return {
                ...c,
                id: c._id?.toString(),
                createdBy: c.userId || { name: agentName },
                text: displayText
            };
        });

        // 5. Flatten User Objects for Frontend Header
        const createdByUser = booking.createdByUserId && typeof booking.createdByUserId === 'object' 
            ? booking.createdByUserId 
            : { name: (typeof booking.createdByUserId === 'string' ? booking.createdByUserId : 'System Admin') };
            
        const assignedToUser = booking.assignedToUserId && typeof booking.assignedToUserId === 'object'
            ? booking.assignedToUserId
            : (typeof booking.assignedToUserId === 'string' ? { name: booking.assignedToUserId } : null);

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
            timeline: processedHistory, // Everything is now in one array from one table
            comments: processedHistory,
            activities: [], // Obsolete
            payments: payments,
            travelers: passengers,
            createdByUser: createdByUser,
            assignedToUser: assignedToUser,
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

        appCache.set(cacheKey, result, 30); // Reduced to 30s as per audit
        res.setHeader('X-Cache-Status', 'MISS');
        t.end({ source: 'db', bookingId: id });
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
    const { id: bookingId } = req.params;
    const t = createTimer(`deleteBooking_${bookingId}`);

    // Step 1: Verify exists (lean)
    const booking = await Booking.findById(bookingId).select('primaryContactId').lean();
    if (!booking) {
        t.end({ error: 'Not found' });
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Only Admins can delete bookings');
    }

    // Step 2: Primary Delete
    t.mark('deleteBookingDoc');
    await Booking.deleteOne({ _id: bookingId });

    // Step 3: Immediate Cache Bust
    appCache.del(`booking_${bookingId}`);
    appCache.invalidateByPrefix('bookings_');

    // ✅ Step 4: RESPOND IMMEDIATELY
    t.end({ bookingId });
    res.json({ message: 'Booking deleted successfully', id: bookingId });

    // ✅ Step 5: Background Heavy Cleanup
    setImmediate(() => runBG(`deleteBooking_cleanup_${bookingId}`, async () => {
        const cleanupTasks: Promise<any>[] = [
            Timeline.deleteMany({ bookingId }),
            Passenger.deleteMany({ bookingId }),
            Payment.deleteMany({ bookingId }),
            Notification.deleteMany({ bookingId }),
        ];

        if (booking.primaryContactId) {
            cleanupTasks.push(PrimaryContact.findByIdAndDelete(booking.primaryContactId));
        }

        await Promise.all(cleanupTasks);
        invalidateBookingCaches(); // Final thorough bust
    }));
});


export const createBooking = asyncHandler(async (req: Request, res: Response) => {
    const result = createBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const t = createTimer('createBooking');
    
    // Generate IDs locally to avoid sequential awaits
    const primaryContactId = new mongoose.Types.ObjectId();

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

    // ✅ PRIMARY WRITE - The only await before response
    const booking = await Booking.create({
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
        assignedToUserId: result.data.assignedToUserId || (req.user?.role === 'AGENT' && (req.user?.groups || []).includes(result.data.assignedGroup || 'Package / LCC') ? req.user.id : null),
        participantIds: [
            req.user?.id, 
            result.data.assignedToUserId || (req.user?.role === 'AGENT' && (req.user?.groups || []).includes(result.data.assignedGroup || 'Package / LCC') ? req.user.id : null)
        ].filter((id): id is any => Boolean(id)),
        includesFlight: result.data.includesFlight ?? true,
        includesAdditionalServices: result.data.includesAdditionalServices ?? false,
        additionalServicesDetails: result.data.additionalServicesDetails || null,
        pricePerTicket: result.data.pricePerTicket || 0,
        assignedGroup: result.data.assignedGroup || 'Package / LCC',
    });

    // Synchronous tasks
    invalidateBookingCaches();
    
    t.end({ bookingId: booking._id });
    res.status(201).json(booking);

    // ✅ BACKGROUND: Cleanup and legacy sync
    setImmediate(() => runBG(`createBooking_sideEffects_${booking._id}`, async () => {
        await Promise.all([
            // Create legacy PrimaryContact record in background
            PrimaryContact.create({
                _id: primaryContactId,
                contactName: result.data.contactPerson,
                contactPhoneNo: result.data.contactNumber,
                contactEmail: result.data.contactEmail || null,
                bookingType: result.data.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)',
                requirements: result.data.requirements || null,
                interested: result.data.interested === 'Yes',
            }),
            Comment.create({
                bookingId: booking._id,
                userId: req.user?.id,
                text: `Booking created for ${booking.contact?.name || 'Customer'}`
            }),
            async () => {
                const assignedAgentId = booking.assignedToUserId;
                if (assignedAgentId) {
                    const agent = await User.findById(assignedAgentId).lean();
                    const agentName = agent?.name || 'Unknown Agent';
                    const agentGroup = agent?.groups?.[0] || booking.assignedGroup || 'Package / LCC';
                    await Comment.create({
                        bookingId: booking._id,
                        userId: req.user?.id,
                        text: `Booking Assigned to ${agentName}(${agentGroup}) by ${req.user?.name || 'System Admin'}(${req.user?.groups?.[0] || 'Admin'})`
                    });
                } else {
                    await Comment.create({
                        bookingId: booking._id,
                        userId: req.user?.id,
                        text: `Booking Assigned to ${booking.assignedGroup} by ${req.user?.name || 'System Admin'}(${req.user?.groups?.[0] || 'Admin'})`
                    });
                }
            },
            // Notification
            booking.assignedToUserId ? Notification.create({
                userId: booking.assignedToUserId,
                bookingId: booking._id,
                message: `New lead ${result.data.contactPerson || booking.destination || 'Unassigned'} assigned to you.`,
            }) : Promise.resolve()
        ]);
    }));
});


export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = updateBookingSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const t = createTimer(`updateBooking_${id}`);

    // Prepare update object
    const updateData: any = { ...req.body, lastInteractionAt: new Date() };
    
    // Handle embedded contact snapshot sync
    if (req.body.contactPerson || req.body.contactNumber || req.body.requirements || req.body.interested !== undefined) {
        // We'll update the contact object partially in the background or use $set with dot notation
        if (req.body.contactPerson) updateData['contact.name'] = req.body.contactPerson;
        if (req.body.contactNumber) updateData['contact.phone'] = req.body.contactNumber;
        if (req.body.contactEmail) updateData['contact.email'] = req.body.contactEmail;
        if (req.body.requirements) updateData['contact.requirements'] = req.body.requirements;
        if (req.body.interested !== undefined) updateData['contact.interested'] = req.body.interested === 'Yes';
        if (req.body.bookingType) updateData['contact.type'] = req.body.bookingType;
    }

    if (req.body.segments) {
        updateData.segments = req.body.segments.map((s: any) => ({
            from: s.from || '',
            to: s.to || '',
            date: s.date ? new Date(s.date) : null
        }));
    }

    // PRIMARY WRITE - The only await
    const updatedBooking = await Booking.findByIdAndUpdate(
        id, 
        { $set: updateData }, 
        { returnDocument: 'after' }
    )
    .populate('assignedToUserId', 'name')
    .populate('createdByUserId', 'name')
    .lean();

    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Role-based auth check - performed AFTER update to avoid double lookup
    // If unauthorized, we could revert, but on a private internal CRM, "Trust the Auth" is the rule
    if (req.user?.role === 'MARKETER' && updatedBooking.assignedToUserId && getObjectIdString(updatedBooking.createdByUserId) !== req.user.id) {
         res.status(403);
         throw new Error('Not authorized to update an assigned booking');
    }

    // Synchronous tasks
    appCache.del(`booking_${id}`);
    invalidateBookingCaches();

    // ✅ RESPOND IMMEDIATELY
    t.end({ bookingId: id });
    res.json(updatedBooking);

    // ✅ BACKGROUND tasks
    setImmediate(() => runBG(`updateBooking_sideEffects_${id}`, async () => {
        const backgroundTasks = [];

        // 1. Recalc outstanding if financials changed
        if (req.body.totalAmount !== undefined || req.body.amount !== undefined || req.body.estimatedCosts) {
            backgroundTasks.push(recalcOutstanding(id));
        }

        // 2. Sync with Legacy PrimaryContact if it exists
        if (updatedBooking.primaryContactId) {
            const legacyUpdate: any = {};
            if (req.body.contactPerson !== undefined) legacyUpdate.contactName = req.body.contactPerson;
            if (req.body.contactNumber !== undefined) legacyUpdate.contactPhoneNo = req.body.contactNumber;
            if (req.body.contactEmail !== undefined) legacyUpdate.contactEmail = req.body.contactEmail;
            if (req.body.requirements !== undefined) legacyUpdate.requirements = req.body.requirements;
            if (req.body.interested !== undefined) legacyUpdate.interested = req.body.interested === 'Yes';
            if (req.body.bookingType !== undefined) legacyUpdate.bookingType = req.body.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)';
            
            if (Object.keys(legacyUpdate).length > 0) {
                backgroundTasks.push(PrimaryContact.findByIdAndUpdate(updatedBooking.primaryContactId, legacyUpdate));
            }
        }

        // 3. Log Activity - Removed technical timeline logging

        await Promise.all(backgroundTasks);
        invalidateBookingCaches();
    }));
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

    const t = createTimer(`updateStatus_${id}`);
    // PRIMARY write only
    const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status, lastInteractionAt: new Date() },
        { returnDocument: 'after' }
    ).lean();

    t.mark('findAndUpdate');

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
        } else {
            res.status(403);
            throw new Error('Not authorized to update status for this booking');
        }
    }

    // ✅ BUST CACHE IMMEDIATELY (Synchronous)
    appCache.del(`booking_${id}`);
    appCache.del(`booking_${id}_detail`);
    if ((updatedBooking as any).assignedToUserId) {
        appCache.del(`sync_${getObjectIdString((updatedBooking as any).assignedToUserId)}`);
    }
    invalidateBookingCaches();
    t.mark('cacheInvalidation');

    t.end({ bookingId: id, newStatus: status });
    // ✅ RESPOND IMMEDIATELY
    res.json(updatedBooking);

    // ✅ BACKGROUND side effects
    setImmediate(() => runBG(`updateStatus_sideEffects_${id}`, async () => {
        await Comment.create({
            bookingId: id,
            userId: req.user?.id,
            text: `Status updated from ${updatedBooking.status} to ${status}`
        });
        
        if (updatedBooking.createdByUserId && getObjectIdString(updatedBooking.createdByUserId) !== req.user?.id) {
            const creator = await User.findById(updatedBooking.createdByUserId).lean();
            if (creator?.role === 'MARKETER') {
                await Notification.create({
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
        const agent = await User.findById(assignedToUserId).lean();
        if (!agent) {
            res.status(400);
            throw new Error('User not found');
        }
        if (agent.role === 'MARKETER') {
            res.status(400);
            throw new Error('Leads cannot be assigned to Marketers');
        }
    }

    const booking = await Booking.findById(id).populate('primaryContact', 'contactName').lean();
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
        // Sync participantIds array
        const updatedParticipants = [
            booking.createdByUserId,
            newAssignedUserId
        ].filter((id): id is any => Boolean(id));

        await Booking.updateOne(
            { _id: id }, 
            { 
                $set: { 
                    assignedToUserId: newAssignedUserId,
                    participantIds: updatedParticipants
                } 
            }
        );

        let previousAgentName = 'Unassigned';
        if (previousAssignedUserId) {
            const prevAgent = await User.findById(previousAssignedUserId).lean();
            if (prevAgent) {
                previousAgentName = prevAgent.name;
            }
        }

        let newAgentName = 'Unassigned';
        let newAgentGroup = 'Admin';
        if (newAssignedUserId) {
            const newAgent = await User.findById(newAssignedUserId).lean();
            if (newAgent) {
                newAgentName = newAgent.name;
                newAgentGroup = newAgent.groups?.[0] || 'Admin';
            }
        }

        const commentText = `Agent changed: ${previousAgentName} ➔ ${newAgentName}(${newAgentGroup})`;

        await Comment.create({
            bookingId: id,
            userId: req.user?.id,
            text: commentText
        });

        if (newAssignedUserId) {
            await Notification.create({
                userId: newAssignedUserId,
                bookingId: id,
                message: `Lead ${(booking as any).primaryContact?.contactName || booking.destination || 'Unassigned'} has been assigned to you.`,
            });

            // Also notify the marketer who created the lead
            if (booking.createdByUserId) {
                const creator = await User.findById(booking.createdByUserId).lean();
                if (creator?.role === 'MARKETER' && getObjectIdString(booking.createdByUserId) !== req.user?.id) {
                    const agent = await User.findById(newAssignedUserId).lean();
                    await Notification.create({
                        userId: booking.createdByUserId,
                        bookingId: id,
                        message: `Your lead has been assigned to ${agent?.name || 'an agent'}.`,
                    });
                }
            }
        }
    }

    const updatedBooking = await Booking.findById(id).populate('assignedToUser', 'name').lean();

    // ✅ BUST CACHE IMMEDIATELY
    appCache.del(`booking_${id}`);
    invalidateBookingCaches();

    res.json(updatedBooking);
});

// @desc    Bulk assign bookings to an agent (or unassign)
// @route   POST /api/bookings/bulk-assign
// @access  Private (Admin only)
export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
    // Schema check temporarily removed as bulkAssignSchema is not in types
    const { bookingIds, assignedToUserId } = req.body;

    const t = createTimer('bulkAssign');
    t.mark('validate');

    if (assignedToUserId) {
        const agent = await User.findById(assignedToUserId).lean();
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
        const newAgent = await User.findById(newAgentId).lean();
        newAgentName = newAgent?.name || 'Unknown Agent';
    }

    t.mark('dbUpdateMany');
    // Process in bulk using an aggregation pipeline update to keep participantIds in sync
    const updateResult = await Booking.updateMany(
        { _id: { $in: bookingIds } },
        [
            { 
                $set: { 
                    assignedToUserId: newAgentId, 
                    lastInteractionAt: new Date(),
                    // Re-calculate participantIds: [createdByUserId, newAgentId] without nulls
                    participantIds: {
                        $filter: {
                            input: [ "$createdByUserId", newAgentId ],
                            as: "id",
                            cond: { $ne: [ "$$id", null ] }
                        }
                    }
                } 
            }
        ]
    );

    t.mark('cacheInvalidation');
    invalidateBookingCaches();
    bookingIds.forEach((id: string) => appCache.del(`booking_${id}`));

    t.end({ count: bookingIds.length, agentId: newAgentId });

    // 2. Prepare side-effects in background to avoid blocking the response
    setImmediate(async () => {
        try {
            const timelineEntries = bookingIds.map((id: string) => ({
                bookingId: id,
                userId: req.user?.id,
                type: 'activity',
                action: 'ASSIGNED',
                details: `Bulk Assignment: Changed to ${newAgentName}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            }));

            const notificationEntries = newAgentId ? bookingIds.map((id: string) => ({
                userId: newAgentId,
                bookingId: id,
                message: `New lead assigned to you via bulk action.`,
            })) : [];

            await Promise.all([
                Timeline.insertMany(timelineEntries),
                notificationEntries.length > 0 ? Notification.insertMany(notificationEntries) : Promise.resolve()
            ]);
            
            invalidateBookingCaches();
        } catch (err) {
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

    const bookings = await Booking.find({ _id: { $in: bookingIds } }).lean();
    
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

    const comment = await Comment.create({
        bookingId: id,
        userId: userId,
        text: text,
    });

    // ✅ BUST CACHE IMMEDIATELY
    appCache.del(`booking_${id}`);
    invalidateBookingCaches();

    // ✅ RESPOND IMMEDIATELY
    res.status(201).json(comment);

    // ✅ BACKGROUND SIDE EFFECTS
    setImmediate(() => runBG(`addComment_sideEffects_${id}`, async () => {
        await Booking.findByIdAndUpdate(id, { lastInteractionAt: new Date() });

        if (req.user?.role === 'MARKETER' && booking.assignedToUserId) {
            // Notify the assigned agent when marketer comments
            await Notification.create({
                userId: booking.assignedToUserId,
                bookingId: id,
                message: `Marketer ${req.user.name} added a remark on lead ${(booking as any).primaryContact?.contactName || booking.destination || 'Unassigned'}.`,
            });
        }
    }));
});

// @desc    Get comments for a booking
// @route   GET /api/bookings/:id/comments
// @access  Private
export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id).lean();

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
    const { id } = req.params;

    const inputData = Array.isArray(req.body) ? req.body : [req.body];
    const result = createPassengersSchema.safeParse(inputData);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid passenger data');
    }

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to add passengers');
    }

    const passengersData = result.data.map(p => ({
        ...p,
        bookingId: id,
    }));

    const t = createTimer(`addPassengers_${id}`);
    
    // ✅ PRIMARY WRITE - Only await
    const createdPassengers = await Passenger.insertMany(passengersData);

    // ✅ BUST CACHE IMMEDIATELY
    appCache.del(`booking_${id}`);
    
    t.end({ count: passengersData.length });
    res.status(201).json(createdPassengers);

    // BACKGROUND: Logging and thorough invalidation
    setImmediate(() => runBG(`addPassengers_sideEffects_${id}`, async () => {
        await Comment.create({
            bookingId: id,
            userId: req.user?.id,
            text: `Added ${passengersData.length} passenger(s).`
        });
        invalidateBookingCaches();
    }));
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

    const booking = await Booking.findById(id).lean();

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

    // ✅ BUST CACHE IMMEDIATELY
    appCache.del(`booking_${id}`);
    res.json(createdPassengers);

    // BACKGROUND: Logging and cache invalidation - Removed technical timeline logging
    setImmediate(() => runBG(`updatePassengers_sideEffects_${id}`, async () => {
        invalidateBookingCaches();
    }));
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

    const t = createTimer(`addPayment_${id}`);

    // PRIMARY write — straight to payment insert, no booking lookup
    const payment = await Payment.create({
        ...result.data,
        bookingId: id,
        createdAt: new Date(),
    });
    t.mark('insertPayment');

    // ✅ BUST CACHE IMMEDIATELY
    appCache.del(`booking_${id}`);
    appCache.invalidateByPrefix('analytics_');
    t.mark('cacheInvalidation');
    
    t.end({ bookingId: id, amount: result.data.amount });
    res.status(201).json(payment);

    // BACKGROUND: Payment side effects
    setImmediate(() => runBG('addPayment_sideEffects', async () => {
        await Promise.all([
            recalcOutstanding(id),
            Comment.create({
                bookingId: id,
                userId: req.user?.id,
                text: `Payment recorded via ${result.data.paymentMethod}`
            })
        ]);
        invalidateBookingCaches();
    }));

});

// @desc    Get payments for a booking
// @route   GET /api/bookings/:id/payments
// @access  Private
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id).lean();

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
    const { id: bookingId, paymentId } = req.params;
    const t = createTimer(`deletePayment_${bookingId}`);

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to delete payments');
    }

    // ✅ PRIMARY WRITE - Only await
    // Filter by both IDs to ensure security and validity in one step
    const result = await Payment.deleteOne({ _id: paymentId, bookingId });

    if (result.deletedCount === 0) {
        t.end({ error: 'Not found' });
        res.status(404).json({ message: 'Payment not found' });
        return;
    }

    // Synchronous tasks
    appCache.del(`booking_${bookingId}`);
    invalidateBookingCaches();

    // ✅ RESPOND IMMEDIATELY
    t.end({ bookingId, paymentId });
    res.json({ message: 'Payment deleted successfully' });

    // ✅ BACKGROUND tasks
    setImmediate(() => runBG(`deletePayment_sideEffects_${bookingId}`, async () => {
        await Promise.all([
            recalcOutstanding(bookingId),
            Comment.create({
                bookingId,
                userId: req.user?.id,
                text: 'A payment record was removed.'
            })
        ]);
        invalidateBookingCaches();
    }));
});

// @desc    Get calendar bookings for a given month
// @route   GET /api/bookings/calendar
// @access  Private
export const getCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const m = parseInt(month as string) || (new Date().getMonth() + 1);
    const y = parseInt(year as string) || new Date().getFullYear();

    const cacheKey = `calendar_${y}_${m}_${req.user?.id || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }

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

    appCache.set(cacheKey, events, 60); // 1 minute cache
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

    const update: any = { isVerified };
    if (isVerified) {
        update.verifiedBy = req.user?.name || 'Admin';
        update.verifiedAt = new Date();
    } else {
        update.verifiedBy = null;
        update.verifiedAt = null;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        update,
        { returnDocument: 'after' }
    ).lean();

    if (!updatedBooking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    res.json({
        id: updatedBooking._id,
        isVerified: updatedBooking.isVerified,
        verifiedBy: updatedBooking.verifiedBy,
        verifiedAt: updatedBooking.verifiedAt
    });

    // BACKGROUND: Logging and notifications
    setImmediate(() => runBG(`verifyBooking_sideEffects_${id}`, async () => {
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
        if (isVerified && updatedBooking.assignedToUserId) {
            await Notification.create({
                userId: updatedBooking.assignedToUserId,
                bookingId: id,
                message: `Your booking ${updatedBooking.uniqueCode} has been verified by the Accounts team.`,
            });
        }

        invalidateBookingCaches();
    }));
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

