import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Contact from '../models/Contact';
import Comment from '../models/Comment';
import Passenger from '../models/Passenger';
import User from '../models/User';
import Payment from '../models/Payment';
import Segment from '../models/Segment';
import Cost from '../models/Cost';
import Notification from '../models/Notification';
import Activity from '../models/Activity';
import { logActivity } from '../utils/activityLogger';
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

// Helper: build the frontend-compatible response shape from normalized collections
const buildBookingResponse = async (bookingDoc: any) => {
    const booking = bookingDoc.toObject ? bookingDoc.toObject() : bookingDoc;
    const contact = await Contact.findById(booking.contactId).lean();
    const segments = await Segment.find({ bookingId: booking._id }).sort({ legNumber: 1 }).lean();
    const costs = await Cost.find({ bookingId: booking._id }).lean();
    const passengers = await Passenger.find({ bookingId: booking._id }).lean();

    return {
        ...booking,
        id: booking._id.toString(),
        createdOn: booking.createdAt,
        // Contact fields (flattened for frontend compat)
        status: contact?.status || 'Pending',
        interested: contact?.interested || null,
        assignedGroup: contact?.assignedGroup || null,
        contactPerson: contact?.contactName || '',
        contactName: contact?.contactName || '',
        contactNumber: contact?.contactPhoneNo || '',
        contactEmail: contact?.contactEmail || null,
        requirements: contact?.requirements || null,
        bookingType: contact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        // Segment fields (first leg for backwards compat)
        flightFrom: segments[0]?.flightFrom || null,
        flightTo: segments[0]?.flightTo || null,
        travelDate: segments[0]?.departureTime || null,
        returnDate: segments[0]?.returnDepartureTime || null,
        destination: segments[0]?.flightTo || null,
        destinationCity: segments[0]?.flightTo || null,
        segments: segments,
        // Cost fields
        estimatedCosts: costs.filter(c => c.costKind === 'estimated'),
        actualCosts: costs.filter(c => c.costKind === 'actual'),
        // Traveler count
        travellers: passengers.length,
        travelers: passengers,
        // Amount compat
        amount: booking.lumpSumAmount || 0,
        totalAmount: booking.lumpSumAmount || 0,
    };
};

// Helper to clear all booking-related caches
const invalidateBookingCaches = () => {
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');
    appCache.invalidateByPrefix('booking_');
};

// Helper to recalculate and save outstanding balance on a booking
const recalcOutstanding = async (bookingId: string) => {
    const payments = await Payment.find({ bookingId });
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const booking = await Booking.findById(bookingId);
    if (booking) {
        const bookingTotal = booking.lumpSumAmount || 0;
        booking.outstanding = Math.max(bookingTotal - totalPaid, 0);
        await booking.save();
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
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = new mongoose.Types.ObjectId(req.user.id);
    }

    console.time('getBookingStats');

    const stats = await Contact.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                booked: { $sum: { $cond: [{ $eq: ["$status", "Booked"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                working: { $sum: { $cond: [{ $eq: ["$status", "Working"] }, 1, 0] } },
                sent: { $sum: { $cond: [{ $eq: ["$status", "Sent"] }, 1, 0] } },
                followUp: { $sum: { $cond: [{ $eq: ["$status", "Follow up"] }, 1, 0] } },
            }
        }
    ]);
    console.timeEnd('getBookingStats');

    const result = stats.length > 0 ? {
        total: stats[0].total,
        booked: stats[0].booked,
        pending: stats[0].pending,
        working: stats[0].working,
        sent: stats[0].sent,
        followUp: stats[0].followUp,
    } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0, followUp: 0 };

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
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    } else if (req.user?.role === 'MARKETER') {
        query.createdByUserId = req.user.id;
    }

    const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedToUserId', 'name')
        .lean();

    const mapped = await Promise.all(bookings.map(async (b) => {
        const contact = await Contact.findById(b.contactId).lean();
        const segments = await Segment.find({ bookingId: b._id }).sort({ legNumber: 1 }).lean();
        return {
            ...b,
            id: b._id.toString(),
            createdOn: b.createdAt,
            status: contact?.status || 'Pending',
            contactPerson: contact?.contactName,
            contactName: contact?.contactName,
            contactNumber: contact?.contactPhoneNo,
            bookingType: contact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
            flightFrom: segments[0]?.flightFrom || null,
            flightTo: segments[0]?.flightTo || null,
            destination: segments[0]?.flightTo || null,
            destinationCity: segments[0]?.flightTo || null,
            travelDate: segments[0]?.departureTime || null,
            amount: b.lumpSumAmount || (b as any).totalAmount || 0,
            travellers: await Passenger.countDocuments({ bookingId: b._id }),
            assignedToUser: b.assignedToUserId,
        };
    }));
    appCache.set(cacheKey, mapped, 60);
    res.json(mapped);
});

// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '10', myBookings, outstandingOnly } = req.query;

    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${outstandingOnly || ''}_${page}_${limit}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    // --- Build Contact query (status, interested, assignment, search) ---
    const contactQuery: any = {};
    const bookingQuery: any = {};
    const perms = req.user?.permissions;
    const isAdmin = req.user?.role === 'ADMIN';

    // Permission-based visibility — on Contact now
    if (req.user?.role === 'MARKETER') {
        // Marketers see only bookings they created — still on Booking
        bookingQuery.createdByUserId = req.user.id;
    } else if (myBookings === 'true') {
        // "My Bookings" — check both Contact.assignedToUserId and Booking.createdByUserId
        contactQuery.assignedToUserId = new mongoose.Types.ObjectId(req.user!.id);
    } else if (assignedTo) {
        const agentArray = (assignedTo as string).split(',').map(a => a.trim());
        const hasUnassigned = agentArray.includes('unassigned');
        const realAgentIds = agentArray.filter(a => a !== 'unassigned');

        if (hasUnassigned && realAgentIds.length > 0) {
            contactQuery.$or = [
                { assignedToUserId: null },
                { assignedToUserId: { $in: realAgentIds } }
            ];
        } else if (hasUnassigned) {
            contactQuery.assignedToUserId = null;
        } else {
            contactQuery.assignedToUserId = { $in: realAgentIds };
        }
    } else if (!isAdmin && perms) {
        if (perms.leadVisibility === 'own') {
            contactQuery.assignedToUserId = new mongoose.Types.ObjectId(req.user!.id);
        }
    }

    // Operation/Account users: only see Booked
    if (!isAdmin && perms && (perms.featureAccess?.operation || perms.featureAccess?.account)) {
        if (perms.leadVisibility !== 'all' && !perms.canAssignLeads) {
            contactQuery.status = 'Booked';
        }
    }

    // Status filter — on Contact
    if (status) {
        const statusArray = (status as string).split(',').map(s => s.trim());
        const bookingStatuses = statusArray.filter(s => !['Interested', 'Not Interested'].includes(s));
        const interestFilters = statusArray.filter(s => ['Interested', 'Not Interested'].includes(s));

        if (bookingStatuses.length > 0) {
            contactQuery.status = { $in: bookingStatuses };
        }
        if (interestFilters.length > 0) {
            const interestValues = interestFilters.map(f => f === 'Interested' ? 'Yes' : 'No');
            contactQuery.interested = { $in: interestValues };
        }
    }

    // Date filter — on Booking.createdAt (still on bookings)
    if (fromDate || toDate) {
        bookingQuery.createdAt = {};
        if (fromDate) bookingQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) bookingQuery.createdAt.$lte = new Date(toDate as string);
    }

    // Search — on Contact fields
    if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        contactQuery.$or = [
            ...(contactQuery.$or || []),
            { contactName: searchRegex },
            { contactPhoneNo: searchRegex },
            { requirements: searchRegex },
        ];
    }

    // Outstanding filter — on Booking
    if (String(outstandingOnly) === 'true') {
        bookingQuery.outstanding = { $gt: 0 };
    }

    // Step 1: Get matching contactIds
    let contactIds: mongoose.Types.ObjectId[] | null = null;
    if (Object.keys(contactQuery).length > 0) {
        const matchingContacts = await Contact.find(contactQuery).select('_id').lean();
        contactIds = matchingContacts.map(c => (c as any)._id);

        if (contactIds.length === 0) {
            res.json({
                data: [],
                meta: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 },
            });
            return;
        }
        bookingQuery.contactId = { $in: contactIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    const reqId = Date.now().toString(36);
    console.log(`[GET] /api/bookings - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);
    console.time(`getBookingsQuery_${reqId}`);

    const [rawBookings, total] = await Promise.all([
        Booking.find(bookingQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .lean(),
        Booking.countDocuments(bookingQuery),
    ]);
    console.timeEnd(`getBookingsQuery_${reqId}`);

    // Map each booking with contact + segment + cost data for frontend compat
    const mappedBookings = await Promise.all(rawBookings.map(async (b) => {
        const contact = await Contact.findById(b.contactId).lean();
        const segments = await Segment.find({ bookingId: b._id }).sort({ legNumber: 1 }).lean();
        const costs = await Cost.find({ bookingId: b._id }).lean();
        const passengerCount = await Passenger.countDocuments({ bookingId: b._id });

        return {
            ...b,
            id: b._id.toString(),
            createdOn: b.createdAt,
            status: contact?.status || 'Pending',
            contactPerson: contact?.contactName || '',
            contactName: contact?.contactName || '',
            contactNumber: contact?.contactPhoneNo || '',
            contactEmail: contact?.contactEmail || null,
            requirements: contact?.requirements || null,
            interested: contact?.interested || null,
            bookingType: contact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
            assignedGroup: contact?.assignedGroup || null,
            flightFrom: segments[0]?.flightFrom || null,
            flightTo: segments[0]?.flightTo || null,
            travelDate: segments[0]?.departureTime || null,
            destination: segments[0]?.flightTo || null,
            destinationCity: segments[0]?.flightTo || null,
            travellers: passengerCount,
            travelers: [],
            createdByUser: b.createdByUserId,
            assignedToUser: b.assignedToUserId,
            companyName: b.companyName,
            estimatedCosts: costs.filter(c => c.costKind === 'estimated'),
            actualCosts: costs.filter(c => c.costKind === 'actual'),
            estimatedMargin: b.estimatedMargin,
            netMargin: b.netMargin,
            amount: b.lumpSumAmount || (b as any).totalAmount || 0,
            totalAmount: b.lumpSumAmount || (b as any).totalAmount || 0,
        };
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
    const cached = appCache.get(cacheKey);
    
    // Auth Check Function (internal)
    const checkAuth = (b: any) => {
        const creatorId = (b.createdByUserId as any)?._id?.toString() || b.createdByUserId?.toString();
        if (req.user?.role === 'MARKETER' && creatorId !== String(req.user.id)) {
            return false;
        }
        return true;
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

    console.log(`[GET] /api/bookings/${id}`);
    console.time(`getBookingById_${id}`);
    const booking = await Booking.findById(id)
        .populate('assignedToUserId', 'name email')
        .populate('createdByUserId', 'name')
        .lean();

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (!checkAuth(booking)) {
        res.status(403);
        throw new Error('Not authorized to view this booking');
    }

    // Fetch all related data in parallel
    const [contact, segments, costs, passengers, comments, payments, activities] = await Promise.all([
        Contact.findById(booking.contactId).lean(),
        Segment.find({ bookingId: id }).sort({ legNumber: 1 }).lean(),
        Cost.find({ bookingId: id }).lean(),
        Passenger.find({ bookingId: id }).lean(),
        Comment.find({ bookingId: id }).populate('createdBy', 'name role').sort({ createdAt: -1 }).lean(),
        Payment.find({ bookingId: id }).sort({ date: -1 }).lean(),
        Activity.find({ bookingId: id }).populate('userId', 'name').sort({ createdAt: -1 }).lean(),
    ]);
    console.timeEnd(`getBookingById_${id}`);

    const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const bookingTotal = booking.lumpSumAmount || (booking as any).totalAmount || 0;
    const outstanding = Math.max(bookingTotal - totalPaid, 0);

    const result = {
        ...booking,
        id: booking._id.toString(),
        createdOn: booking.createdAt,
        outstanding,
        status: contact?.status || 'Pending',
        contactPerson: contact?.contactName || '',
        contactName: contact?.contactName || '',
        contactNumber: contact?.contactPhoneNo || '',
        contactEmail: contact?.contactEmail || null,
        requirements: contact?.requirements || null,
        interested: contact?.interested || null,
        bookingType: contact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        assignedGroup: contact?.assignedGroup || null,
        flightFrom: segments[0]?.flightFrom || null,
        flightTo: segments[0]?.flightTo || null,
        travelDate: segments[0]?.departureTime || null,
        returnDate: segments[0]?.returnDepartureTime || null,
        destination: segments[0]?.flightTo || null,
        destinationCity: segments[0]?.flightTo || null,
        segments,
        estimatedCosts: costs.filter(c => c.costKind === 'estimated'),
        actualCosts: costs.filter(c => c.costKind === 'actual'),
        travellers: passengers.length,
        travelers: passengers,
        passengers,
        comments,
        payments,
        amount: bookingTotal,
        totalAmount: bookingTotal,
        createdByUser: booking.createdByUserId,
        assignedToUser: booking.assignedToUserId,
        companyName: booking.companyName,
        estimatedMargin: booking.estimatedMargin,
        netMargin: booking.netMargin,
        activities,
    };
    appCache.set(cacheKey, result, 60);
    res.json(result);
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

    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Not authorized to delete bookings. Only Admins can perform this action.');
    }

    console.time(`deleteBooking_${req.params.id}`);
    // Parallel deletion of all related records
    await Promise.all([
        Comment.deleteMany({ bookingId: req.params.id }),
        Passenger.deleteMany({ bookingId: req.params.id }),
        Payment.deleteMany({ bookingId: req.params.id }),
        Segment.deleteMany({ bookingId: req.params.id }),
        Cost.deleteMany({ bookingId: req.params.id }),
        Notification.deleteMany({ bookingId: req.params.id }),
        booking.contactId ? Contact.findByIdAndDelete(booking.contactId) : Promise.resolve(),
        Booking.findByIdAndDelete(req.params.id)
    ]);
    console.timeEnd(`deleteBooking_${req.params.id}`);

    invalidateBookingCaches();
    res.json({ message: 'Booking and all related records removed successfully' });
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

    // Stage 1: Create Contact (holds status, assignment, lead lifecycle)
    const contact = await Contact.create({
        contactName: result.data.contactPerson,
        contactPhoneNo: result.data.contactNumber,
        bookingType: result.data.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)',
        requirements: result.data.requirements || null,
        status: 'Pending',
        assignedToUserId: req.user?.role === 'AGENT' ? req.user.id : null,
        assignedGroup: result.data.assignedGroup || null,
    });

    // Stage 2: Create Booking linked to contact
    const dbStart = Date.now();
    const booking = await Booking.create({
        contactId: contact._id,
        tripType: result.data.tripType || 'one-way',
        lumpSumAmount: result.data.amount || 0,
        createdByUserId: req.user?.id,
        assignedToUserId: req.user?.role === 'AGENT' ? req.user.id : null,
        includesFlight: result.data.includesFlight ?? true,
        includesAdditionalServices: result.data.includesAdditionalServices ?? false,
        additionalServicesDetails: result.data.additionalServicesDetails || null,
        companyName: null,
    });

    // Stage 3: Create Segment docs if flight data provided (parallel)
    const segmentPromises: Promise<any>[] = [];
    if (result.data.includesFlight !== false && (result.data.flightFrom || result.data.flightTo)) {
        segmentPromises.push(Segment.create({
            bookingId: booking._id,
            legNumber: 1,
            flightFrom: result.data.flightFrom || null,
            flightTo: result.data.flightTo || null,
            departureTime: result.data.travelDate || null,
        }));
    }
    if (result.data.segments && result.data.segments.length > 0) {
        result.data.segments.forEach((seg, idx) => {
            segmentPromises.push(Segment.create({
                bookingId: booking._id,
                legNumber: idx + 1,
                flightFrom: seg.from || null,
                flightTo: seg.to || null,
                departureTime: seg.date || null,
            }));
        });
    }
    await Promise.all(segmentPromises);
    const dbTime = Date.now() - dbStart;

    const totalTime = Date.now() - startTime;
    console.log(`[BOOKING PERF] Create Booking - Total: ${totalTime}ms | DB: ${dbTime}ms`);

    // Build response using helper
    const responseBooking = await buildBookingResponse(booking);
    responseBooking.createdByUser = { _id: req.user?.id, name: req.user?.name } as any;

    invalidateBookingCaches();
    res.status(201).json(responseBooking);
});

// @desc    Verify a booking (Account/Admin only)
// @route   PATCH /api/bookings/:id/verify
// @access  Private (canVerifyBookings or ADMIN)
export const verifyBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Status now lives on Contact
    const contact = await Contact.findById(booking.contactId);
    if (!contact || contact.status !== 'Booked') {
        res.status(400);
        throw new Error('Only booked queries can be verified');
    }

    booking.verified = true;
    booking.verifiedBy = new mongoose.Types.ObjectId(req.user!.id);
    await booking.save();

    invalidateBookingCaches();
    res.json({ message: 'Booking verified successfully', verified: true, verifiedBy: req.user!.id });
});

// @desc    Unverify a booking (Admin only)
// @route   DELETE /api/bookings/:id/verify
// @access  Private (ADMIN only)
export const unverifyBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Only administrators can unverify bookings');
    }

    booking.verified = false;
    booking.verifiedBy = null;
    await booking.save();

    invalidateBookingCaches();
    res.json({ message: 'Booking unverified successfully', verified: false });
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

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (req.user?.role === 'MARKETER') {
        if (booking.assignedToUserId) {
            res.status(403);
            throw new Error('Not authorized to update an assigned booking');
        }
        const allowedFields = ['requirements'];
        const keys = Object.keys(req.body);
        const forbiddenKeys = keys.filter(k => !allowedFields.includes(k));
        
        if (forbiddenKeys.length > 0) {
            res.status(403);
            throw new Error('Marketers are only authorized to update Detailed Requirements');
        }
    } else if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    // Update Booking-level fields
    if (result.data.tripType !== undefined) booking.tripType = result.data.tripType || 'one-way';
    if (result.data.amount !== undefined) (booking as any).lumpSumAmount = result.data.amount;
    if (result.data.totalAmount !== undefined) (booking as any).lumpSumAmount = result.data.totalAmount;
    if (result.data.finalQuotation !== undefined) booking.finalQuotation = result.data.finalQuotation;
    if (result.data.includesFlight !== undefined) booking.includesFlight = result.data.includesFlight;
    if (result.data.includesAdditionalServices !== undefined) booking.includesAdditionalServices = result.data.includesAdditionalServices;
    if (result.data.additionalServicesDetails !== undefined) booking.additionalServicesDetails = result.data.additionalServicesDetails || null;
    if (result.data.companyName !== undefined) booking.companyName = result.data.companyName || null;

    // Update Contact fields (status, interested, requirements, assignedGroup)
    const contactUpdate: any = {};
    if (result.data.requirements !== undefined) contactUpdate.requirements = result.data.requirements;
    if (result.data.interested !== undefined) contactUpdate.interested = result.data.interested;
    if (result.data.assignedGroup !== undefined) contactUpdate.assignedGroup = result.data.assignedGroup || null;
    if (result.data.bookingType !== undefined) contactUpdate.bookingType = result.data.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)';
    if (Object.keys(contactUpdate).length > 0) {
        await Contact.findByIdAndUpdate(booking.contactId, contactUpdate);
    }

    // Update Segments if provided (delete + recreate)
    if (result.data.segments !== undefined) {
        await Segment.deleteMany({ bookingId: id });
        const segDocs = (result.data.segments || []).map((s, idx) => ({
            bookingId: id,
            legNumber: idx + 1,
            flightFrom: s.from || null,
            flightTo: s.to || null,
            departureTime: s.date || null,
        }));
        if (segDocs.length > 0) await Segment.insertMany(segDocs);
    } else if (result.data.flightFrom !== undefined || result.data.flightTo !== undefined || result.data.travelDate !== undefined) {
        // Update first segment if individual flight fields are sent
        const existingSeg = await Segment.findOne({ bookingId: id, legNumber: 1 });
        if (existingSeg) {
            if (result.data.flightFrom !== undefined) existingSeg.flightFrom = result.data.flightFrom || null;
            if (result.data.flightTo !== undefined) existingSeg.flightTo = result.data.flightTo || null;
            if (result.data.travelDate !== undefined) existingSeg.departureTime = result.data.travelDate || null;
            await existingSeg.save();
        } else {
            await Segment.create({
                bookingId: id,
                legNumber: 1,
                flightFrom: result.data.flightFrom || null,
                flightTo: result.data.flightTo || null,
                departureTime: result.data.travelDate || null,
            });
        }
    }

    // Update Costs if provided (delete + recreate)
    if (result.data.estimatedCosts !== undefined) {
        await Cost.deleteMany({ bookingId: id, costKind: 'estimated' });
        const costDocs = (result.data.estimatedCosts || []).map(c => ({
            bookingId: id,
            costKind: 'estimated',
            costType: c.costType,
            price: c.price,
            source: c.source || null,
        }));
        if (costDocs.length > 0) await Cost.insertMany(costDocs);
    }
    if (result.data.actualCosts !== undefined) {
        await Cost.deleteMany({ bookingId: id, costKind: 'actual' });
        const costDocs = (result.data.actualCosts || []).map(c => ({
            bookingId: id,
            costKind: 'actual',
            costType: c.costType,
            price: c.price,
            source: c.source || null,
        }));
        if (costDocs.length > 0) await Cost.insertMany(costDocs);
    }

    // Recalculate margins
    const allCosts = await Cost.find({ bookingId: id }).lean();
    const totalEstimated = allCosts.filter(c => c.costKind === 'estimated').reduce((s, c) => s + (c.price || 0), 0);
    const totalActual = allCosts.filter(c => c.costKind === 'actual').reduce((s, c) => s + (c.price || 0), 0);
    const income = (booking as any).lumpSumAmount || 0;
    booking.estimatedMargin = income - totalEstimated;
    booking.netMargin = income - totalActual;

    await booking.save();

    // Recalculate outstanding if amount changed
    if (result.data.totalAmount !== undefined || result.data.amount !== undefined) {
        await recalcOutstanding(id);
    }

    const responseBooking = await buildBookingResponse(booking);

    invalidateBookingCaches();
    res.json(responseBooking);
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

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to update booking status');
    }

    if (req.user?.role === 'AGENT' && getObjectIdString(existingBooking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    const newStatus = result.data.status as 'Pending' | 'Working' | 'Sent' | 'Booked';

    // Get current contact status for activity log
    const contact = await Contact.findById(existingBooking.contactId);
    if (!contact) {
        res.status(404);
        throw new Error('Contact not found');
    }

    const oldStatus = contact.status;

    // Log activity
    await logActivity(id, req.user!.id, 'STATUS_CHANGE', `Status updated from ${oldStatus} to ${newStatus}`);

    // Update status on Contact
    contact.status = newStatus;
    await contact.save();
    
    // Notify Marketer if their lead status changed
    if (existingBooking.createdByUserId && getObjectIdString(existingBooking.createdByUserId) !== req.user?.id) {
        const creator = await User.findById(existingBooking.createdByUserId);
        if (creator?.role === 'MARKETER') {
            const segments = await Segment.find({ bookingId: id }).sort({ legNumber: 1 }).lean();
            await Notification.create({
                userId: existingBooking.createdByUserId,
                bookingId: id,
                message: `Status of your lead ${segments[0]?.flightTo || contact.contactName || 'Unknown'} updated to ${newStatus}.`,
            });
        }
    }

    invalidateBookingCaches();
    const responseBooking = await buildBookingResponse(existingBooking);
    res.json(responseBooking);
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
        if (!agent) {
            res.status(400);
            throw new Error('Invalid user selected');
        }
    }

    const booking = await Booking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const contact = await Contact.findById(booking.contactId);
    const previousAssignedUserId = getObjectIdString(booking.assignedToUserId) || null;
    const newAssignedUserId = assignedToUserId || null;

    if (previousAssignedUserId !== newAssignedUserId) {
        // Update on both Booking AND Contact
        booking.assignedToUserId = newAssignedUserId as any;
        await booking.save();
        if (contact) {
            contact.assignedToUserId = newAssignedUserId as any;
            await contact.save();
        }

        let previousAgentName = 'Unassigned';
        if (previousAssignedUserId) {
            const prevAgent = await User.findById(previousAssignedUserId);
            if (prevAgent) previousAgentName = prevAgent.name;
        }

        let newAgentName = 'Unassigned';
        if (newAssignedUserId) {
            const newAgent = await User.findById(newAssignedUserId);
            if (newAgent) newAgentName = newAgent.name;
        }

        const actionText = `Agent changed: ${previousAgentName} ➔ ${newAgentName}`;
        await logActivity(id, req.user!.id, 'ASSIGNED', actionText);

        if (newAssignedUserId) {
            await Notification.create({
                userId: newAssignedUserId,
                bookingId: id,
                message: `Lead ${contact?.contactName || 'Unassigned'} has been assigned to you.`,
            });

            if (booking.createdByUserId) {
                const creator = await User.findById(booking.createdByUserId);
                if (creator?.role === 'MARKETER' && getObjectIdString(booking.createdByUserId) !== req.user?.id) {
                    await Notification.create({
                        userId: booking.createdByUserId,
                        bookingId: id,
                        message: `Your lead has been assigned to ${newAgentName}.`,
                    });
                }
            }
        }
    }

    invalidateBookingCaches();
    const responseBooking = await buildBookingResponse(booking);
    res.json(responseBooking);
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
    const bookings = await Booking.find({ _id: { $in: bookingIds } });
    
    const updatePromises = bookings.map(async (booking) => {
        const previousAssignedUserId = getObjectIdString(booking.assignedToUserId) || null;
        
        if (previousAssignedUserId !== (newAgentId ? newAgentId.toString() : null)) {
            booking.assignedToUserId = newAgentId as any;
            await booking.save();
            // Also update Contact
            await Contact.findByIdAndUpdate(booking.contactId, { assignedToUserId: newAgentId });

            let previousAgentName = 'Unassigned';
            if (previousAssignedUserId) {
                const prevAgent = await User.findById(previousAssignedUserId);
                previousAgentName = prevAgent?.name || 'Unknown Agent';
            }

            const actionText = `Agent changed: ${previousAgentName} ➔ ${newAgentName}`;
            await logActivity(booking._id, req.user!.id, 'ASSIGNED', actionText);

            if (newAgentId) {
                const contact = await Contact.findById(booking.contactId).lean();
                await Notification.create({
                    userId: newAgentId,
                    bookingId: booking._id,
                    message: `Lead ${contact?.contactName || 'Unassigned'} has been assigned to you.`,
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

    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to comment on this booking');
    }

    let comment = await Comment.create({
        text: result.data.text,
        bookingId: id,
        createdById: req.user!.id,
    });

    comment = await comment.populate('createdBy', 'name role');

    // Notification Logic
    if (req.user?.role === 'MARKETER' && booking.assignedToUserId) {
        // Notify the assigned agent when marketer comments
        await Notification.create({
            userId: booking.assignedToUserId,
            bookingId: id,
            message: `Marketer ${req.user.name} added a remark on lead ${(booking as any).primaryContact?.contactName || booking.uniqueCode || 'Unassigned'}.`,
        });
    }

    invalidateBookingCaches();
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

    const comments = await Comment.find({ bookingId: id })
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 });

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

    await logActivity(id, req.user!.id, 'PASSENGERS_ADDED', `Added ${passengersData.length} passenger details.`);

    invalidateBookingCaches();
    res.status(201).json(createdPassengers);
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

    invalidateBookingCaches();
    res.json(createdPassengers);
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
        throw new Error('Not authorized to add payment to this booking');
    }

    const payment = await Payment.create({
        ...result.data,
        bookingId: id,
    });

    await logActivity(id, req.user!.id, 'PAYMENT_RECORDED', `Payment of ${result.data.amount} recorded via ${result.data.paymentMethod}.`);

    await recalcOutstanding(id);
    invalidateBookingCaches();
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

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to delete payments');
    }

    if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete payment from this booking');
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.bookingId.toString() !== id) {
        res.status(404);
        throw new Error('Payment not found for this booking');
    }

    await Payment.findByIdAndDelete(paymentId);

    await recalcOutstanding(id);
    invalidateBookingCaches();
    res.json({ message: 'Payment removed successfully' });
});

// @desc    Get calendar bookings for a given month
// @route   GET /api/bookings/calendar
// @access  Private
export const getCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const m = parseInt(month as string) || (new Date().getMonth() + 1);
    const y = parseInt(year as string) || new Date().getFullYear();

    const startDateStr = new Date(y, m - 1, 1).toISOString();
    const endDateStr = new Date(y, m, 0, 23, 59, 59).toISOString();

    // Find Segments with departures in this month
    const segments = await Segment.find({
        departureTime: { $gte: startDateStr, $lte: endDateStr }
    }).lean();

    const bookingIds = [...new Set(segments.map(s => s.bookingId.toString()))];

    const bookingQuery: any = { _id: { $in: bookingIds } };
    if (req.user?.role === 'AGENT') {
        bookingQuery.assignedToUserId = req.user.id;
    }

    const bookings = await Booking.find(bookingQuery).lean();

    const events = await Promise.all(bookings.map(async (b) => {
        const contact = await Contact.findById(b.contactId).lean();
        const firstSegment = segments.find(s => s.bookingId.toString() === b._id.toString());
        
        return {
            id: b._id.toString(),
            title: contact?.contactName || b.uniqueCode || 'Booking',
            date: firstSegment?.departureTime || null,
            status: contact?.status || 'Pending',
            destination: firstSegment?.flightTo || '',
        };
    }));

    res.json(events);
});

// @desc    Get activity log for a booking
// @route   GET /api/bookings/:id/activity
// @access  Private
export const getBookingActivity = asyncHandler(async (req: Request, res: Response) => {
    const { default: Activity } = await import('../models/Activity');
    
    const activities = await Activity.find({ bookingId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('userId', 'name')
        .lean();

    const mapped = activities.map(a => ({
        id: (a as any)._id.toString(),
        action: a.action,
        details: a.details,
        user: (a as any).userId?.name || 'System',
        createdAt: a.createdAt,
    }));

    res.json(mapped);
});

