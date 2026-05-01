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
import Activity from '../models/Activity';
import Traveler from '../models/Traveler';
import { logActivity } from '../utils/activityLogger';

import {
    createBookingSchema,
    updateBookingStatusSchema,
    assignBookingSchema,
    bulkAssignSchema,
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
export const getBookingStats = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `stats_${req.user?.id || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
                res.json(cached);
        return;
    }

    const query: any = {};
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = new mongoose.Types.ObjectId(req.user.id);
    }


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
                res.json(cached);
        return;
    }

    const query: any = {};
    if (req.user?.role === 'AGENT') {
        query.assignedToUserId = req.user.id;
    }

    const bookings = await Booking.find(query)
        .select('uniqueCode status assignedToUserId primaryContactId flightFrom flightTo destination travelDate amount createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedToUser', 'name')
        .populate('primaryContact', 'contactName contactPhoneNo bookingType')
        .lean();

    const mapped = bookings.map(b => ({ 
        ...b, 
        id: b._id.toString(),
        contactPerson: (b as any).primaryContact?.contactName,
        contactNumber: (b as any).primaryContact?.contactPhoneNo,
        bookingType: (b as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        travellers: b.travellers,
        travelers: (b as any).passengers,
    }));
    appCache.set(cacheKey, mapped, 60);
    res.json(mapped);
});

// @desc    Get all bookings (with filtering & pagination)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, assignedTo, search, fromDate, toDate, travelDateFilter, page = '1', limit = '10', myBookings } = req.query;

    const cacheKey = `bookings_${req.user?.id || 'all'}_${status || ''}_${assignedTo || ''}_${search || ''}_${fromDate || ''}_${toDate || ''}_${travelDateFilter || ''}_${myBookings || ''}_${page}_${limit}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
                res.json(cached);
        return;
    }

    const query: any = {};
    const primaryContactQuery: any = {};

    if (myBookings === 'true') {
        query.$or = [
            { assignedToUserId: req.user?.id },
            { createdByUserId: req.user?.id },
        ];
    } else if (req.user?.role === 'AGENT') {
        if (!search) {
            query.$or = [
                { assignedToUserId: req.user.id },
                { assignedToUserId: { $exists: false } },
                { assignedToUserId: null },
            ];
        }
    } else if (assignedTo) {
        query.assignedToUserId = assignedTo as string;
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

    const reqId = Date.now().toString(36);
    console.log(`[GET] /api/bookings - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);
    console.time(`getBookingsQuery_${reqId}`);
    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .select('uniqueCode status flightFrom flightTo destination travelDate tripType amount travellers createdByUserId assignedToUserId primaryContactId createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('assignedToUser', 'name')
            .populate('createdByUser', 'name')
            .populate('primaryContact', 'contactName contactPhoneNo requirements interested bookingType')
            .lean(),
        Booking.countDocuments(query),
    ]);
    console.timeEnd(`getBookingsQuery_${reqId}`);


    const mappedBookings = bookings.map(b => ({
        ...b,
        id: b._id.toString(),
        contactPerson: (b as any).primaryContact?.contactName,
        contactNumber: (b as any).primaryContact?.contactPhoneNo,
        requirements: (b as any).primaryContact?.requirements,
        interested: (b as any).primaryContact?.interested,
        bookingType: (b as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        travellers: b.travellers,
        travelers: (b as any).passengers,
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
    if (cached) {
                res.json(cached);
        return;
    }

    console.log(`[GET] /api/bookings/${id}`);
    console.time(`getBookingById_${id}`);
    const [booking, activities] = await Promise.all([
        Booking.findById(id)
            .populate('assignedToUser', 'name email')
            .populate('createdByUser', 'name')
            .populate('primaryContact', 'contactName contactPhoneNo requirements interested bookingType')
            .populate({
                path: 'comments',
                populate: { path: 'createdBy', select: 'name role' },
                options: { sort: { createdAt: -1 } },
                select: 'text createdById createdAt'
            })
            .populate('passengers', 'name phoneNumber email dob anniversary country flightFrom flightTo departureTime arrivalTime tripType returnDate returnDepartureTime returnArrivalTime')
            .populate('payments', 'amount paymentMethod date remarks transactionId')
            .lean(),
        Activity.find({ bookingId: id })
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .lean(),
    ]);
    console.timeEnd(`getBookingById_${id}`);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Calculate outstanding for each payment context
    const totalPaid = (booking as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const outstanding = ((booking as any).amount || 0) - totalPaid;

    const mappedActivities = activities.map(a => ({
        ...a,
        id: a._id.toString(),
        user: (a as any).userId?.name || 'System',
    }));

    const result = {
        ...booking,
        id: booking!._id.toString(),
        outstanding,
        contactPerson: (booking as any).primaryContact?.contactName,
        contactNumber: (booking as any).primaryContact?.contactPhoneNo,
        requirements: (booking as any).primaryContact?.requirements,
        interested: (booking as any).primaryContact?.interested,
        bookingType: (booking as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: booking.destination,
        travellers: booking.travellers,
        travelers: (booking as any).passengers,
        activities: mappedActivities,
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
        throw new Error('Only administrators can delete bookings');
    }

    const bookingObjectId = new mongoose.Types.ObjectId(req.params.id);

    console.time(`deleteBooking_${req.params.id}`);
    // Parallel deletion of all related records
    await Promise.all([
        Comment.deleteMany({ bookingId: bookingObjectId }),
        Payment.deleteMany({ bookingId: bookingObjectId }),
        Notification.deleteMany({ bookingId: bookingObjectId }),
        Activity.deleteMany({ bookingId: bookingObjectId }),
        booking.primaryContactId ? PrimaryContact.findByIdAndDelete(booking.primaryContactId) : Promise.resolve(),
        Booking.findByIdAndDelete(bookingObjectId)
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
    });
    const dbTime = Date.now() - dbStart;

    const totalTime = Date.now() - startTime;
    console.log(`[BOOKING PERF] Create Booking - Total: ${totalTime}ms | DB: ${dbTime}ms`);

    // Populate for response
    const populatedBooking = await Booking.findById(booking._id)
        .populate('primaryContact', 'contactName contactPhoneNo requirements interested bookingType')
        .lean();

    await logActivity(booking._id, req.user?.id, 'BOOKING_CREATED', `Booking created for ${primaryContact.contactName}`);

    const resultBooking = {
        ...populatedBooking,
        id: populatedBooking!._id.toString(),
        contactPerson: (populatedBooking as any).primaryContact?.contactName,
        contactNumber: (populatedBooking as any).primaryContact?.contactPhoneNo,
        requirements: (populatedBooking as any).primaryContact?.requirements,
        interested: (populatedBooking as any).primaryContact?.interested,
        bookingType: (populatedBooking as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: populatedBooking!.destination,
        travellers: populatedBooking!.travellers,
        travelers: (populatedBooking as any).passengers,
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

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id && booking.createdByUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    // Track specific changes for activity logging
    const changes: string[] = [];
    if (result.data.destination !== undefined && result.data.destination !== booking.destination) {
        changes.push(`Destination: ${booking.destination || 'None'} → ${result.data.destination || 'None'}`);
    }
    if (result.data.amount !== undefined && result.data.amount !== booking.amount) {
        changes.push(`Price: ${booking.amount || 0} → ${result.data.amount}`);
    }
    if (result.data.finalQuotation !== undefined && result.data.finalQuotation !== booking.finalQuotation) {
        changes.push(`Final Quotation: ${booking.finalQuotation || "None"} → ${result.data.finalQuotation}`);
    }
    if (result.data.tripType !== undefined && result.data.tripType !== booking.tripType) {
        changes.push(`Trip Type: ${booking.tripType} → ${result.data.tripType}`);
    }
    if (result.data.travellers !== undefined && result.data.travellers !== booking.travellers) {
        changes.push(`Travellers: ${booking.travellers || 0} → ${result.data.travellers}`);
    }

    // Update booking-level fields
    if (result.data.destination !== undefined) booking.destination = result.data.destination || null;
    if (result.data.travelDate !== undefined) booking.travelDate = result.data.travelDate ? new Date(result.data.travelDate) : null;
    if (result.data.flightFrom !== undefined) booking.flightFrom = result.data.flightFrom || null;
    if (result.data.flightTo !== undefined) booking.flightTo = result.data.flightTo || null;
    if (result.data.tripType !== undefined) booking.tripType = result.data.tripType || 'one-way';
    if (result.data.amount !== undefined) booking.amount = result.data.amount;
    if (result.data.finalQuotation !== undefined) booking.finalQuotation = result.data.finalQuotation;
    if (result.data.travellers !== undefined) booking.travellers = result.data.travellers || null;

    await booking.save();

    const detailMessage = changes.length > 0 
        ? `Modified: ${changes.join(', ')}` 
        : 'Booking details were modified.';
    
    await logActivity(id, req.user?.id, 'BOOKING_UPDATED', detailMessage);


    // Update PrimaryContact fields if provided
    if (booking.primaryContactId && (result.data.requirements !== undefined || result.data.interested !== undefined)) {
        const updateData: any = {};
        if (result.data.requirements !== undefined) updateData.requirements = result.data.requirements;
        if (result.data.interested !== undefined) updateData.interested = result.data.interested;
        await PrimaryContact.findByIdAndUpdate(booking.primaryContactId, updateData);
    }

    const updatedBooking = await Booking.findById(id)
        .populate('primaryContact', 'contactName contactPhoneNo requirements interested bookingType')
        .populate('assignedToUser', 'name')
        .lean();

    const resultBooking = {
        ...updatedBooking,
        id: updatedBooking!._id.toString(),
        contactPerson: (updatedBooking as any).primaryContact?.contactName,
        contactNumber: (updatedBooking as any).primaryContact?.contactPhoneNo,
        requirements: (updatedBooking as any).primaryContact?.requirements,
        interested: (updatedBooking as any).primaryContact?.interested,
        bookingType: (updatedBooking as any).primaryContact?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: updatedBooking!.destination,
        travellers: updatedBooking!.travellers,
        travelers: (updatedBooking as any).passengers,
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

    if (req.user?.role === 'AGENT' && existingBooking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    const { status } = result.data;
    const oldStatus = existingBooking.status;
    existingBooking.status = status;
    const updatedBooking = await existingBooking.save();

    await logActivity(id, req.user?.id, 'STATUS_CHANGE', `Status updated from ${oldStatus} to ${status}`);

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
        
        await logActivity(id, req.user?.id, 'ASSIGNED', `Agent changed: ${previousAgentName} ➔ ${newAgentName}`);
    }

    const updatedBooking = await Booking.findById(id).populate('assignedToUser', 'name');

    invalidateBookingCaches();
    res.json(updatedBooking);
});

// @desc    Bulk assign bookings to an agent (or unassign)
// @route   POST /api/bookings/bulk-assign
// @access  Private (Admin only)
export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
    const result = bulkAssignSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }

    const { bookingIds, assignedToUserId } = result.data;

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
    
    // We'll use a for...of loop or map with Promise.all
    // For each booking, check if assignment changed, then update and create comment
    const updatePromises = bookings.map(async (booking) => {
        const previousAssignedUserId = booking.assignedToUserId?.toString() || null;
        
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

            await logActivity(booking._id, req.user?.id, 'ASSIGNED', `Agent changed: ${previousAgentName} ➔ ${newAgentName}`);

            if (newAgentId) {
                await Notification.create({
                    userId: newAgentId,
                    bookingId: booking._id,
                    message: `Booking has been assigned to you.`,
                });
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

    await logActivity(id, req.user?.id, 'COMMENT_ADDED', `New comment: "${result.data.text.substring(0, 50)}${result.data.text.length > 50 ? '...' : ''}"`);

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

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add passengers to this booking');
    }

    const passengersData = result.data.map(p => ({
        ...p,
        bookingId: id,
    }));

    const dbStart = Date.now();
    const createdPassengers = await Passenger.insertMany(passengersData);
    
    // Synchronize traveler count on the booking
    const passengerCount = await Passenger.countDocuments({ bookingId: new mongoose.Types.ObjectId(id) });
    await Booking.findByIdAndUpdate(id, { travellers: passengerCount });
    await logActivity(id, req.user?.id, 'PASSENGERS_ADDED', `Added ${passengersData.length} passenger details.`);
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

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update passengers for this booking');
    }

    const passengersData = result.data.map(p => ({
        ...p,
        bookingId: id,
    }));

    const dbStart = Date.now();
    await Passenger.deleteMany({ bookingId: new mongoose.Types.ObjectId(id) });
    const createdPassengers = await Passenger.insertMany(passengersData);
    
    // Synchronize traveler count on the booking
    await Booking.findByIdAndUpdate(id, { travellers: createdPassengers.length });
    await logActivity(id, req.user?.id, 'PASSENGERS_UPDATED', `Updated passenger details (${createdPassengers.length} total).`);
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

    if (req.user?.role === 'AGENT' && booking.assignedToUserId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to add payment to this booking');
    }

    const payment = await Payment.create({
        ...result.data,
        bookingId: id,
    });

    await logActivity(id, req.user?.id, 'PAYMENT_RECORDED', `Payment of ${result.data.amount} recorded via ${result.data.paymentMethod}.`);

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

    if (req.user?.role !== 'ADMIN') {
        res.status(403);
        throw new Error('Only administrators can delete payments from bookings');
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.bookingId.toString() !== id) {
        res.status(404);
        throw new Error('Payment not found for this booking');
    }

    const paymentAmount = payment.amount;
    await Payment.findByIdAndDelete(paymentId);
    await logActivity(id, req.user?.id, 'PAYMENT_DELETED', `Payment of ${paymentAmount} was deleted.`);

    invalidateBookingCaches();
    res.json({ message: 'Payment removed successfully' });
});

// @desc    Get bookings for calendar view (lightweight)
// @route   GET /api/bookings/calendar
// @access  Private
export const getCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    
    const query: any = {
        travelDate: { $ne: null }
    };

    if (req.user?.role === 'AGENT') {
        query.$or = [
            { assignedToUserId: req.user.id },
            { assignedToUserId: { $exists: false } },
            { assignedToUserId: null },
        ];
    }

    if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        query.travelDate = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(query)
        .select('uniqueCode status travelDate destination primaryContactId')
        .populate('primaryContact', 'contactName')
        .lean();

    const mapped = bookings.map(b => ({
        id: b._id.toString(),
        title: (b as any).primaryContact?.contactName || b.uniqueCode,
        date: b.travelDate,
        status: b.status,
        destination: b.destination,
    }));

    res.json(mapped);
});

// @desc    Get booking activity timeline
// @route   GET /api/bookings/:id/activity
// @access  Private
export const getBookingActivity = asyncHandler(async (req: Request, res: Response) => {
    const activities = await Activity.find({ bookingId: req.params.id })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const mapped = activities.map(a => ({
        ...a,
        id: a._id.toString(),
        user: (a as any).userId?.name || 'System',
    }));

    res.json(mapped);
});

