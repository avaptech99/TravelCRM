import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Notification from '../models/Notification';
import User from '../models/User';
import mongoose from 'mongoose';
import appCache from '../utils/cache';

// @desc    Get combined dashboard data (stats + recent bookings + notifications)
// @route   GET /api/sync
// @access  Private
export const getGlobalSync = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const cacheKey = `sync_${userId || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }

    const statsQuery: any = {};
    const recentQuery: any = {};

    if (userRole === 'AGENT') {
        const objId = new mongoose.Types.ObjectId(userId);
        statsQuery.$or = [{ assignedToUserId: objId }, { createdByUserId: objId }];
        recentQuery.$or = [{ assignedToUserId: userId }, { createdByUserId: userId }];
    } else if (userRole === 'MARKETER') {
        statsQuery.createdByUserId = new mongoose.Types.ObjectId(userId);
        recentQuery.createdByUserId = userId;
    }

    // Run all queries in parallel
    const [statsResult, recentBookings, notifications, agentsData] = await Promise.all([
        // 1. Stats aggregation
        Booking.aggregate([
            { $match: statsQuery },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'contactId',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            { $unwind: { path: '$contact', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    booked: { $sum: { $cond: [{ $eq: ['$contact.status', 'Booked'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$contact.status', 'Pending'] }, 1, 0] } },
                    working: { $sum: { $cond: [{ $eq: ['$contact.status', 'Working'] }, 1, 0] } },
                    sent: { $sum: { $cond: [{ $eq: ['$contact.status', 'Sent'] }, 1, 0] } },
                }
            }
        ]),

        // 2. Recent bookings (latest 5)
        Booking.find(recentQuery)
            .select('uniqueCode contactId assignedToUserId destination amount createdAt travellers companyName includesFlight tripType lumpSumAmount')
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('assignedToUser', 'name')
            .populate('contactId', 'contactName contactPhoneNo bookingType status')
            .lean(),

        // 3. Notifications (latest 20)
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),

        // 4. Agent count (admin only)
        userRole === 'ADMIN'
            ? User.find({ role: 'AGENT' }).select('_id').lean()
            : Promise.resolve([]),
    ]);

    const stats = statsResult.length > 0 ? {
        total: statsResult[0].total,
        booked: statsResult[0].booked,
        pending: statsResult[0].pending,
        working: statsResult[0].working,
        sent: statsResult[0].sent,
    } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };

    // Fetch segments for recent bookings to get flightFrom, flightTo, travelDate
    const { default: Segment } = await import('../models/Segment');
    const recentBookingIds = recentBookings.map(b => b._id.toString());
    const segments = await Segment.find({ bookingId: { $in: recentBookingIds } }).lean();

    const mappedBookings = recentBookings.map(b => {
        const firstSegment = segments.find(s => s.bookingId.toString() === b._id.toString() && s.legNumber === 1);
        const lastSegment = segments.find(s => s.bookingId.toString() === b._id.toString()); // Just pick any for 'to' if multiple

        return {
            ...b,
            id: b._id.toString(),
            contactPerson: (b as any).contactId?.contactName,
            contactNumber: (b as any).contactId?.contactPhoneNo,
            bookingType: (b as any).contactId?.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
            status: (b as any).contactId?.status || 'Pending',
            destinationCity: lastSegment?.flightTo || '',
            flightFrom: firstSegment?.flightFrom || '',
            flightTo: lastSegment?.flightTo || '',
            travelDate: firstSegment?.departureTime || null,
            travellers: 0,
            amount: (b as any).lumpSumAmount || 0,
        };
    });

    const mappedNotifications = notifications.map(n => ({
        ...n,
        id: (n as any)._id.toString(),
    }));

    const result = {
        stats: {
            ...stats,
            agents: agentsData.length,
        },
        recentBookings: mappedBookings,
        notifications: mappedNotifications,
    };

    appCache.set(cacheKey, result, 30); // Cache for 30 seconds
    res.json(result);
});
