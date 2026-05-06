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
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }

    // Backend Request Deduplication
    if (syncFetchInFlight.has(cacheKey)) {
        try {
            console.log(`[DEDUPLICATED] Sync request for ${userId} served from in-flight promise`);
            const data = await syncFetchInFlight.get(cacheKey);
            return res.json(data);
        } catch (err) {
            // fall through
        }
    }

    const fetchPromise = (async () => {
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

        // Run all queries
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
            Notification.find({ userId })
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

        const mappedBookings = (recentBookings as any[]).map(b => {
            const contactName = b.contact?.name || 'Unknown';
            const contactPhone = b.contact?.phone || '';
            const contactType = b.contact?.type || 'B2C';
            const contactInterested = b.contact?.interested ?? false;

            return {
                ...b,
                id: b._id.toString(),
                contactPerson: contactName,
                contactNumber: contactPhone,
                bookingType: contactType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                interested: contactInterested ? 'Yes' : 'No',
                destinationCity: b.destination,
                travellers: b.travellers,
            };
        });

        const mappedNotifications = notifications.map(n => ({
            ...n,
            id: (n as any)._id.toString(),
        }));

        return {
            stats: {
                ...stats,
                agents: agentsCount,
            },
            recentBookings: mappedBookings,
            notifications: mappedNotifications,
        };
    })();

    syncFetchInFlight.set(cacheKey, fetchPromise);

    try {
        const result = await fetchPromise;
        appCache.set(cacheKey, result, 60);
        res.json(result);
    } finally {
        syncFetchInFlight.delete(cacheKey);
    }
});
