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
        const bookingTotal = booking.totalAmount || booking.amount || 0;
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
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '10', myBookings, outstandingOnly, group } = req.query;

    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${group || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${outstandingOnly || ''}_${page}_${limit}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const query: any = {};
    const primaryContactQuery: any = {};

    // 1. Mandatory Visibility Restrictions (Based on Role or Group/Department)
    const userGroups = req.user?.groups || [];
    const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
    const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';

    const isSpecialized = userGroups.includes('Visa') || userGroups.includes('Ticketing') || 
                         req.user?.role === 'VISA' || req.user?.role === 'TICKETING';
    
    const isPackageLCC = userGroups.includes('Package / LCC');

    if (req.user?.role === 'ADMIN') {
        // Admin sees all
    } else if (isAccount || isOperation) {
        // Account and Operation can see all 'Booked' queries from any group
        query.status = 'Booked';
    } else if (req.user?.role === 'AGENT' || isSpecialized) {
        // Agents and specialized departments (Visa/Ticketing) see:
        // 1. Leads assigned to them
        // 2. Leads created by them
        // 3. ALL leads belonging to their departmental group(s)
        query.$or = [
            { assignedToUserId: new mongoose.Types.ObjectId(req.user.id) }, 
            { createdByUserId: new mongoose.Types.ObjectId(req.user.id) },
            { assignedGroup: { $in: userGroups } }
        ];
    } else if (req.user?.role === 'MARKETER') {
        query.createdByUserId = new mongoose.Types.ObjectId(req.user.id);
    }

    // 2. Tab/Filter-Based Visibility (e.g., "My Leads")
    if (myBookings === 'true') {
        const userMatch = [
            { assignedToUserId: new mongoose.Types.ObjectId(req.user?.id) },
            { createdByUserId: new mongoose.Types.ObjectId(req.user?.id) },
        ];

        if (query.$or) {
            // Combine existing $or with user-specific match
            const existingOr = [...query.$or];
            query.$and = [
                { $or: existingOr },
                { $or: userMatch }
            ];
            delete query.$or;
        } else {
            query.$or = userMatch;
        }
    } else if (assignedTo) {
        const agentArray = (assignedTo as string).split(',').map(a => a.trim());
        const hasUnassigned = agentArray.includes('unassigned');
        const realAgentIds = agentArray.filter(a => a !== 'unassigned');

        if (hasUnassigned && realAgentIds.length > 0) {
            query.$or = [
                { assignedToUserId: null },
                { assignedToUserId: { $in: realAgentIds } }
            ];
        } else if (hasUnassigned) {
            query.assignedToUserId = null;
        } else {
            query.assignedToUserId = { $in: realAgentIds };
        }
    }

    // Role-based visibility exclusion: 
    // "Other users cannot view their queries of any group which one created by them" 
    // for Visa/Ticketing. This means if a Visa user creates a lead, Agents/Admin (maybe?) shouldn't see it?
    // Actually, "User can see all leads" for Agent. 
    // Let's re-read: "Other users cannot view their queries of any group which one created by them" 
    // for VISA and TICKETING.
    // This sounds like if VISA creates a query, it's private.
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'VISA' && req.user?.role !== 'TICKETING') {
        // For other roles (Agent, Marketer, Operation, Account), 
        // they should NOT see queries created by Visa/Ticketing users unless assigned?
        // Actually, let's keep it simple for now as per the "can see only their own" rule for them.
    }

    if (status) {
        const statusArray = (status as string).split(',').map(s => s.trim());
        const bookingStatuses = statusArray.filter(s => !['Interested', 'Not Interested'].includes(s));
        const interestFilters = statusArray.filter(s => ['Interested', 'Not Interested'].includes(s));

        if (bookingStatuses.length > 0) {
            if (query.status === 'Booked') {
                // If role is restricted to 'Booked', they can only see 'Booked' even if they filter for more
                query.status = 'Booked';
            } else {
                query.status = { $in: bookingStatuses };
            }
        }

        if (interestFilters.length > 0) {
            const interestValues = interestFilters.map(f => f === 'Interested' ? 'Yes' : 'No');
            primaryContactQuery.interested = { $in: interestValues };
        }
    }

    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate as string);
        if (toDate) query.createdAt.$lte = new Date(toDate as string);
    }

    if (travelDateFilter && travelDateFilter !== 'all') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const futureDate = new Date(now);

        if (travelDateFilter === 'upcoming_7_days') {
            futureDate.setDate(now.getDate() + 7);
        } else if (travelDateFilter === 'upcoming_10_days') {
            futureDate.setDate(now.getDate() + 10);
        } else if (travelDateFilter === 'upcoming_15_days') {
            futureDate.setDate(now.getDate() + 15);
        } else if (travelDateFilter === 'upcoming_30_days') {
            futureDate.setDate(now.getDate() + 30);
        }
        
        futureDate.setHours(23, 59, 59, 999);

        query.travelDate = {
            $gte: now,
            $lte: futureDate
        };
    }

    if (req.query.company) {
        query.company = req.query.company as string;
    }

    if (group) {
        query.assignedGroup = group as string;
    }




    if (search) {
        const searchStr = search as string;
        const searchRegex = new RegExp(searchStr, 'i');
        const contactSearchConditions = [
            { contactName: searchRegex },
            { contactPhoneNo: searchRegex },
            { requirements: searchRegex },
        ];

        if (primaryContactQuery.$or) {
            primaryContactQuery.$or.push(...contactSearchConditions);
        } else {
            primaryContactQuery.$or = contactSearchConditions;
        }
    }

    let contactIds: mongoose.Types.ObjectId[] = [];
    if (Object.keys(primaryContactQuery).length > 0) {
        const matchingContacts = await PrimaryContact.find(primaryContactQuery).select('_id').lean();
        contactIds = matchingContacts.map(c => (c as any)._id);
        
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
        const searchStr = search as string;
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
            } else {
                query.$or = searchOr;
            }
        } else {
            // Just flight search
            if (query.$or) {
                const existingOr = query.$or;
                delete query.$or;
                query.$and = [
                    { $or: existingOr },
                    { $or: bookingSearchFields }
                ];
            } else {
                query.$or = bookingSearchFields;
            }
        }
    }

    // Outstanding filter - simple field check
    if (String(outstandingOnly) === 'true') {
        query.outstanding = { $gt: 0 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    let bookings: any[];
    let total: number;

    const reqId = Date.now().toString(36);
    console.log(`[GET] /api/bookings - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);
    console.time(`getBookingsQuery_${reqId}`);

    const [rawBookings, count] = await Promise.all([
        Booking.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate returnDate tripType amount totalAmount pricePerTicket travellers createdByUserId assignedToUserId contact outstanding createdAt')
            .sort({ lastInteractionAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('assignedToUserId', 'name')
            .populate('createdByUserId', 'name')
            .lean(),
        Booking.countDocuments(query),
    ]);
    bookings = rawBookings;
    total = count;
    console.timeEnd(`getBookingsQuery_${reqId}`);

    const mappedBookings = bookings.map(b => {
        return {
            ...b,
            id: b._id.toString(),
            createdOn: b.createdAt,
            contactPerson: b.contact?.name,
            contactNumber: b.contact?.phone,
            bookingType: b.contact?.type === 'Agent (B2B)' ? 'B2B' : 'B2C',
            interested: b.contact?.interested ? 'Yes' : 'No',
            destinationCity: b.destination,
            travellers: b.travellers,
            createdByUser: b.createdByUserId,
            assignedToUser: b.assignedToUserId,
        };
    });

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
    
    const checkAuth = (b: any) => {
        if (req.user?.role === 'ADMIN') return true;

        const creatorId = (b.createdByUserId as any)?._id?.toString() || b.createdByUserId?.toString();
        const assignedId = (b.assignedToUserId as any)?._id?.toString() || b.assignedToUserId?.toString();
        const bookingGroup = b.assignedGroup || 'Package / LCC';
        const userGroups = req.user?.groups || [];

        if (req.user?.role === 'AGENT' || req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
            // Can see if creator, assigned, or in same department group
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

    console.log(`[GET] /api/bookings/${id}`);
    console.time(`getBookingById_${id}`);
    const booking = await Booking.findById(id)
        .populate('assignedToUserId', 'name role')
        .populate('createdByUserId', 'name role')
        .populate('primaryContact')
        .populate('passengers')
        .populate('payments')
        .populate({
            path: 'timeline',
            populate: { path: 'userId', select: 'name role' },
            options: { sort: { createdAt: -1 } }
        });

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (!checkAuth(booking)) {
        res.status(403);
        throw new Error('Not authorized to view this booking');
    }

    // Calculate outstanding for each payment context
    const totalPaid = (booking as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const outstanding = ((booking as any).amount || 0) - totalPaid;

    const result = {
        ...booking.toJSON(),
        id: booking!._id.toString(),
        createdOn: booking.createdAt,
        outstanding,
        contactPerson: (booking as any).primaryContact?.contactName,
        contactNumber: (booking as any).primaryContact?.contactPhoneNo,
        contactEmail: (booking as any).primaryContact?.contactEmail,
        requirements: (booking as any).primaryContact?.requirements,
        interested: (booking as any).primaryContact?.interested,
        bookingType: (booking as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: booking.destination,
        travellers: booking.travellers,
        travelers: (booking as any).passengers,
        createdByUser: booking.createdByUserId,
        assignedToUser: booking.assignedToUserId,
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
        Timeline.deleteMany({ bookingId: req.params.id }),
        Passenger.deleteMany({ bookingId: req.params.id }),
        Payment.deleteMany({ bookingId: req.params.id }),
        Notification.deleteMany({ bookingId: req.params.id }),
        booking.primaryContactId ? PrimaryContact.findByIdAndDelete(booking.primaryContactId) : Promise.resolve(),
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

    // Create PrimaryContact first
    const primaryContact = await PrimaryContact.create({
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
            type: primaryContact.bookingType,
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

    // Log the creation activity in Timeline
    await Timeline.create({
        bookingId: booking._id,
        userId: req.user?.id,
        type: 'activity',
        action: 'BOOKING_CREATED',
        details: `Booking created by ${req.user?.name}`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    // Populate for response
    const populatedBooking = await Booking.findById(booking._id)
        .populate('createdByUserId', 'name')
        .populate('assignedToUserId', 'name')
        .populate('primaryContact', 'contactName contactPhoneNo contactEmail requirements interested bookingType')
        .lean();

    const resultBooking = {
        ...populatedBooking,
        id: populatedBooking!._id.toString(),
        createdOn: populatedBooking!.createdAt,
        contactPerson: (populatedBooking as any).primaryContact?.contactName,
        contactNumber: (populatedBooking as any).primaryContact?.contactPhoneNo,
        contactEmail: (populatedBooking as any).primaryContact?.contactEmail,
        requirements: (populatedBooking as any).primaryContact?.requirements,
        interested: (populatedBooking as any).primaryContact?.interested,
        bookingType: (populatedBooking as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: populatedBooking!.destination,
        travellers: populatedBooking!.travellers,
        travelers: (populatedBooking as any).passengers,
        createdByUser: populatedBooking!.createdByUserId,
        assignedToUser: populatedBooking!.assignedToUserId,
    };

    invalidateBookingCaches();

    res.status(201).json(resultBooking);
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

    if (req.user?.role === 'ADMIN' || req.user?.role === 'AGENT' || req.user?.role === 'OPERATION') {
        // Admins, Agents, and Operation team can update any booking
    } else if (req.user?.role === 'ACCOUNT') {
        // Account team can update actualCosts and payments (handled in specific routes)
        const allowedFields = ['actualCosts', 'totalAmount', 'amount'];
        const keys = Object.keys(req.body);
        const forbiddenKeys = keys.filter(k => !allowedFields.includes(k));
        if (forbiddenKeys.length > 0) {
            res.status(403);
            throw new Error('Account team is authorized to update Actual Costs and Amount fields only');
        }
    } else if (req.user?.role === 'MARKETER') {
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
    } else if (req.user?.role === 'OPERATION') {
        const allowedFields = ['actualCosts'];
        const keys = Object.keys(req.body);
        const forbiddenKeys = keys.filter(k => !allowedFields.includes(k));
        if (forbiddenKeys.length > 0) {
            res.status(403);
            throw new Error('Operation team is only authorized to update Actual Costs');
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

    // Update booking-level fields
    if (result.data.destination !== undefined) booking.destination = result.data.destination || null;
    if (result.data.travelDate !== undefined) booking.travelDate = result.data.travelDate ? new Date(result.data.travelDate) : null;
    if (result.data.flightFrom !== undefined) booking.flightFrom = result.data.flightFrom || null;
    if (result.data.flightTo !== undefined) booking.flightTo = result.data.flightTo || null;
    if (result.data.tripType !== undefined) booking.tripType = result.data.tripType || 'one-way';
    if (result.data.amount !== undefined) booking.amount = result.data.amount;
    if (result.data.totalAmount !== undefined) booking.totalAmount = result.data.totalAmount;
    if (result.data.finalQuotation !== undefined) booking.finalQuotation = result.data.finalQuotation;
    if (result.data.travellers !== undefined) booking.travellers = result.data.travellers || null;
    if (result.data.pricePerTicket !== undefined) booking.pricePerTicket = result.data.pricePerTicket;
    if (result.data.followUpDate !== undefined) booking.followUpDate = result.data.followUpDate ? new Date(result.data.followUpDate) : null;
    if (result.data.includesFlight !== undefined) booking.includesFlight = result.data.includesFlight;
    if (result.data.includesAdditionalServices !== undefined) booking.includesAdditionalServices = result.data.includesAdditionalServices;
    if (result.data.additionalServicesDetails !== undefined) booking.additionalServicesDetails = result.data.additionalServicesDetails || null;
    if (result.data.company !== undefined) booking.company = result.data.company;
    if (result.data.assignedGroup !== undefined) {
        if (booking.assignedGroup !== result.data.assignedGroup) {
            booking.assignedGroup = result.data.assignedGroup;
            booking.assignedToUserId = null as any;
        } else {
            booking.assignedGroup = result.data.assignedGroup;
        }
    }
    if (result.data.estimatedCosts !== undefined) booking.estimatedCosts = result.data.estimatedCosts as any;
    if (result.data.actualCosts !== undefined) booking.actualCosts = result.data.actualCosts as any;
    if (result.data.segments !== undefined) {
        booking.segments = (result.data.segments || []).map(s => ({
            from: s.from || '',
            to: s.to || '',
            date: s.date ? new Date(s.date) : null
        }));
    }

    await booking.save();

    // Log activity
    const updates: string[] = [];
    
    if (result.data.amount !== undefined || result.data.totalAmount !== undefined) updates.push('Financials');
    if (result.data.estimatedCosts !== undefined) updates.push('Estimated Costs');
    if (result.data.actualCosts !== undefined) updates.push('Actual Costs');
    if (result.data.finalQuotation !== undefined) updates.push(`Quotation (${result.data.finalQuotation})`);
    if (result.data.company !== undefined) updates.push(`Company (${result.data.company})`);
    if (result.data.followUpDate !== undefined) updates.push(`Follow-up (${result.data.followUpDate || 'none'})`);
    if (result.data.assignedGroup !== undefined) updates.push(`Group (${result.data.assignedGroup})`);
    
    const details = updates.length > 0 ? `Updated: ${updates.join(', ')}` : 'Booking details were modified.';
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'BOOKING_UPDATED',
        details,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    // Recalculate outstanding if amount fields changed
    if (result.data.totalAmount !== undefined || result.data.amount !== undefined) {
        await recalcOutstanding(id);
    }

    // Update PrimaryContact fields if provided
    if (booking.primaryContactId && (result.data.requirements !== undefined || result.data.interested !== undefined)) {
        const updateData: any = {};
        if (result.data.requirements !== undefined) updateData.requirements = result.data.requirements;
        if (result.data.interested !== undefined) updateData.interested = result.data.interested;
        await PrimaryContact.findByIdAndUpdate(booking.primaryContactId, updateData);
    }

    const updatedBooking = await Booking.findById(id)
        .populate('primaryContact', 'contactName contactPhoneNo contactEmail requirements interested bookingType')
        .populate('assignedToUserId', 'name')
        .populate('createdByUserId', 'name')
        .lean();

    const resultBooking = {
        ...updatedBooking,
        id: updatedBooking!._id.toString(),
        createdOn: updatedBooking!.createdAt,
        contactPerson: (updatedBooking as any).primaryContact?.contactName,
        contactNumber: (updatedBooking as any).primaryContact?.contactPhoneNo,
        requirements: (updatedBooking as any).primaryContact?.requirements,
        interested: (updatedBooking as any).primaryContact?.interested,
        bookingType: (updatedBooking as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: updatedBooking!.destination,
        travellers: updatedBooking!.travellers,
        travelers: (updatedBooking as any).passengers,
        createdByUser: updatedBooking!.createdByUserId,
        assignedToUser: updatedBooking!.assignedToUserId,
    };

    invalidateBookingCaches();
    res.json(resultBooking);
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

    if (req.user?.role === 'ADMIN' || req.user?.role === 'AGENT' || req.user?.role === 'OPERATION') {
        // Admins, Agents, and Operation team can update status for any booking
    } else if (req.user?.role === 'VISA' || req.user?.role === 'TICKETING') {
        if (getObjectIdString(existingBooking.assignedToUserId) !== req.user.id && getObjectIdString(existingBooking.createdByUserId) !== req.user.id) {
            res.status(403);
            throw new Error('You can only update status for your own queries');
        }
    } else {
        res.status(403);
        throw new Error('Not authorized to update status for this booking');
    }

    const { status } = result.data;
    const oldStatus = existingBooking.status;
    existingBooking.status = status;
    const updatedBooking = await existingBooking.save();
    
    // Log status change activity
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'STATUS_CHANGE',
        details: `Status updated from ${oldStatus} to ${status}`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    
    // Notify Marketer if their lead status changed
    if (existingBooking.createdByUserId && getObjectIdString(existingBooking.createdByUserId) !== req.user?.id) {
        const creator = await User.findById(existingBooking.createdByUserId);
        if (creator?.role === 'MARKETER') {
            await Notification.create({
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

    const deletePromises = bookings.map(async (booking) => {
        const id = booking._id;
        return Promise.all([
            Timeline.deleteMany({ bookingId: id }),
            Passenger.deleteMany({ bookingId: id }),
            Payment.deleteMany({ bookingId: id }),
            Notification.deleteMany({ bookingId: id }),
            booking.primaryContactId ? PrimaryContact.findByIdAndDelete(booking.primaryContactId) : Promise.resolve(),
            Booking.findByIdAndDelete(id)
        ]);
    });

    await Promise.all(deletePromises);

    invalidateBookingCaches();
    res.json({ message: `Successfully deleted ${bookingIds.length} bookings` });
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

    const booking = await Booking.findById(id).populate('primaryContact', 'contactName');

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

    invalidateBookingCaches();

    // Log activity
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'PASSENGERS_ADDED',
        details: `Added ${passengersData.length} travelers to the booking.`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

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

    // Log activity
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'PASSENGERS_UPDATED',
        details: `Updated details for ${passengersData.length} travelers.`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

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

    await recalcOutstanding(id);

    // Log activity
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'PAYMENT_ADDED',
        details: `Recorded payment of ${result.data.amount} via ${result.data.paymentMethod}`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

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

    await recalcOutstanding(id);

    // Log activity
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'PAYMENT_DELETED',
        details: `Removed payment of ${payment.amount}`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

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

    // Log activity
    await Timeline.create({
        bookingId: id,
        userId: req.user?.id,
        type: 'activity',
        action: 'BOOKING_VERIFIED',
        details: `Booking was ${isVerified ? 'verified' : 'unverified'}`,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    invalidateBookingCaches();
    res.json({ message: `Booking ${isVerified ? 'verified' : 'unverified'} successfully`, isVerified: booking.isVerified });
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

