import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Notification from '../models/Notification';
import User from '../models/User';
import mongoose from 'mongoose';
import appCache from '../utils/cache';

// Request deduplication for sync fetches
const syncFetchInFlight = new Map<string, Promise<any>>();

// @desc    Get combined dashboard data (stats + recent bookings + notifications)
// @route   GET /api/sync
// @access  Private
export const getGlobalSync = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const cacheKey = `sync_${userId || 'all'}`;
    
    // 1. Check Cache First (Fix #1)
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.json(cached);
        return;
    }

    // 2. Request Deduplication (Fix #1)
    if (syncFetchInFlight.has(cacheKey)) {
        try {
            const data = await syncFetchInFlight.get(cacheKey);
            res.setHeader('X-Cache-Status', 'DEDUPLICATED');
            res.json(data);
            return;
        } catch (err) {
            // fall through to fresh fetch
        }
    }

    const fetchPromise = (async () => {
        const statsQuery: any = {};
        const recentQuery: any = {};

        // Only fetch/count bookings from the last 24 hours for sync to keep it lightweight
        const syncSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (userRole === 'AGENT') {
            const objId = new mongoose.Types.ObjectId(userId);
            statsQuery.$or = [{ assignedToUserId: objId }, { createdByUserId: objId }];
            recentQuery.$or = [{ assignedToUserId: userId }, { createdByUserId: userId }];
        } else if (userRole === 'MARKETER') {
            statsQuery.createdByUserId = new mongoose.Types.ObjectId(userId);
            recentQuery.createdByUserId = userId;
        } else if (userRole === 'ADMIN') {
            statsQuery.updatedAt = { $gte: syncSince };
            recentQuery.updatedAt = { $gte: syncSince };
        }

        // Run all queries in parallel (Fix #1)
        const [statsResult, recentBookings, notifications, agentsCount] = await Promise.all([
            Booking.aggregate([
                { $match: statsQuery },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        booked: { $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                        working: { $sum: { $cond: [{ $eq: ['$status', 'Working'] }, 1, 0] } },
                        sent: { $sum: { $cond: [{ $eq: ['$status', 'Sent'] }, 1, 0] } },
                    }
                }
            ]),
            Booking.find(recentQuery)
                .select('uniqueCode status assignedToUserId contact destination travelDate amount createdAt travellers')
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('assignedToUserId', 'name')
                .lean(),
            Notification.find({ userId, isDismissed: false }) // Filter dismissed
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
            userRole === 'ADMIN' ? User.countDocuments({ role: 'AGENT' }) : Promise.resolve(0)
        ]);

        const stats = statsResult.length > 0 ? {
            total: statsResult[0].total,
            booked: statsResult[0].booked,
            pending: statsResult[0].pending,
            working: statsResult[0].working,
            sent: statsResult[0].sent,
        } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };

        const mappedBookings = (recentBookings as any[]).map(b => ({
            ...b,
            id: b._id.toString(),
            contactPerson: b.contact?.name || 'Unknown',
            destinationCity: b.destination,
        }));

        const mappedNotifications = notifications.map(n => ({
            ...n,
            id: (n as any)._id.toString(),
        }));

        return {
            stats: { ...stats, agents: agentsCount },
            recentBookings: mappedBookings,
            notifications: mappedNotifications,
            syncedAt: new Date()
        };
    })();

    syncFetchInFlight.set(cacheKey, fetchPromise);

    try {
        const result = await fetchPromise;
        // Cache for 30 seconds (Fix #1) - balanced for real-time feel vs load
        appCache.set(cacheKey, result, 30); 
        res.setHeader('X-Cache-Status', 'MISS');
        res.json(result);
    } finally {
        syncFetchInFlight.delete(cacheKey);
    }
});
