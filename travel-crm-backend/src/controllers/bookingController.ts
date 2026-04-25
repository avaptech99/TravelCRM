import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import Comment from '../models/Comment';
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
    if (req.user?.role === 'AGENT') {
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
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '10', myBookings, outstandingOnly } = req.query;

    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${page}_${limit}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const query: any = {};
    const primaryContactQuery: any = {};

    if (req.user?.role === 'MARKETER') {
        query.createdByUserId = req.user.id;
    } else if (myBookings === 'true') {
        query.$or = [
            { assignedToUserId: req.user?.id },
            { createdByUserId: req.user?.id },
        ];
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

    if (status) {
        const statusArray = (status as string).split(',').map(s => s.trim());
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

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    let bookings: any[];
    let total: number;

    const reqId = Date.now().toString(36);
    console.log(`[GET] /api/bookings - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}, Outstanding: ${outstandingOnly}`);
    console.time(`getBookingsQuery_${reqId}`);

    if (outstandingOnly === 'true') {
        const pipeline: any[] = [
            { $match: query },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'bookingId',
                    as: 'paymentDocs'
                }
            },
            {
                $addFields: {
                    totalPaid: { $sum: '$paymentDocs.amount' },
                    calculatedTotal: {
                        $cond: {
                            if: { $and: [{ $ne: ["$totalAmount", null] }, { $gt: ["$totalAmount", 0] }] },
                            then: "$totalAmount",
                            else: { $multiply: [{ $ifNull: ["$pricePerTicket", 0] }, { $ifNull: ["$travellers", 1] }] }
                        }
                    }
                }
            },
            {
                $match: {
                    $expr: {
                        $gt: ['$calculatedTotal', '$totalPaid']
                    },
                    calculatedTotal: { $gt: 0 }
                }
            }
        ];

        const [results, countResults] = await Promise.all([
            Booking.aggregate([
                ...pipeline,
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limitNum },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedToUserId',
                        foreignField: '_id',
                        as: 'assignedToUser'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdByUserId',
                        foreignField: '_id',
                        as: 'createdByUser'
                    }
                },
                {
                    $lookup: {
                        from: 'primarycontacts',
                        localField: 'primaryContactId',
                        foreignField: '_id',
                        as: 'primaryContact'
                    }
                },
                {
                    $unwind: { path: '$assignedToUser', preserveNullAndEmptyArrays: true }
                },
                {
                    $unwind: { path: '$createdByUser', preserveNullAndEmptyArrays: true }
                },
                {
                    $unwind: { path: '$primaryContact', preserveNullAndEmptyArrays: true }
                }
            ]),
            Booking.aggregate([
                ...pipeline,
                { $count: 'total' }
            ])
        ]);

        bookings = results;
        total = countResults[0]?.total || 0;
    } else {
        const [rawBookings, count] = await Promise.all([
            Booking.find(query)
                .select('uniqueCode status flightFrom flightTo destination travelDate returnDate tripType amount totalAmount pricePerTicket travellers createdByUserId assignedToUserId createdByUser assignedToUser primaryContactId createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('assignedToUserId', 'name')
                .populate('createdByUserId', 'name')
                .populate('primaryContact', 'contactName contactPhoneNo requirements interested bookingType')
                .populate('passengers', 'name')
                .populate('payments', 'amount')
                .lean(),
            Booking.countDocuments(query),
        ]);
        bookings = rawBookings;
        total = count;
    }
    console.timeEnd(`getBookingsQuery_${reqId}`);

    const mappedBookings = bookings.map(b => {
        const totalAmount = b.totalAmount !== undefined && b.totalAmount !== null 
            ? b.totalAmount 
            : (b.pricePerTicket ? b.pricePerTicket * (b.travellers || 1) : 0);
        const totalPaid = (b as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const outstanding = totalAmount - totalPaid;

        return {
            ...b,
            id: b._id.toString(),
            createdOn: b.createdAt,
            outstanding,
            contactPerson: (b as any).primaryContact?.contactName,
            contactNumber: (b as any).primaryContact?.contactPhoneNo,
            contactEmail: (b as any).primaryContact?.contactEmail,
            requirements: (b as any).primaryContact?.requirements,
            interested: (b as any).primaryContact?.interested,
            bookingType: (b as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
            destinationCity: b.destination,
            travellers: b.travellers,
            travelers: (b as any).passengers,
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

    if (!checkAuth(booking)) {
        res.status(403);
        throw new Error('Not authorized to view this booking');
    }

    // Calculate outstanding for each payment context
    const totalPaid = (booking as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const outstanding = ((booking as any).amount || 0) - totalPaid;

    const result = {
        ...booking,
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
        Comment.deleteMany({ bookingId: req.params.id }),
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
    const dbStart = Date.now();
    const booking = await Booking.create({
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
    } else if (req.user?.role === 'AGENT' && getObjectIdString(booking.assignedToUserId) !== req.user.id && getObjectIdString(booking.createdByUserId) !== req.user.id) {
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
    if (result.data.includesFlight !== undefined) booking.includesFlight = result.data.includesFlight;
    if (result.data.includesAdditionalServices !== undefined) booking.includesAdditionalServices = result.data.includesAdditionalServices;
    if (result.data.additionalServicesDetails !== undefined) booking.additionalServicesDetails = result.data.additionalServicesDetails || null;
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

    if (req.user?.role === 'MARKETER') {
        res.status(403);
        throw new Error('Marketers are not authorized to update booking status');
    }

    if (req.user?.role === 'AGENT' && getObjectIdString(existingBooking.assignedToUserId) !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    const { status } = result.data;
    existingBooking.status = status;
    const updatedBooking = await existingBooking.save();
    
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

    const booking = await Booking.findById(id).populate('primaryContact', 'contactName');
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
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

            const commentText = `${previousAgentName} ➔ ${newAgentName}`;

            await Comment.create({
                text: commentText,
                bookingId: booking._id,
                createdById: req.user!.id,
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

    const booking = await Booking.findById(id).populate('primaryContact', 'contactName');

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
            message: `Marketer ${req.user.name} added a remark on lead ${(booking as any).primaryContact?.contactName || booking.destination || 'Unassigned'}.`,
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
        .select('uniqueCode status destination travelDate primaryContactId')
        .populate('primaryContact', 'contactName')
        .lean();

    const events = bookings.map(b => ({
        id: b._id.toString(),
        title: (b as any).primaryContact?.contactName || b.uniqueCode || 'Booking',
        date: b.travelDate,
        status: b.status,
        destination: b.destination || '',
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

