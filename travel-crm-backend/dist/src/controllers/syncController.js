"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalSync = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const cache_1 = __importDefault(require("../utils/cache"));
const perfLogger_1 = require("../utils/perfLogger");
// Request deduplication for sync fetches
const syncFetchInFlight = new Map();
// @desc    Get combined dashboard data (stats + recent bookings + notifications)
// @route   GET /api/sync
// @access  Private
exports.getGlobalSync = (0, express_async_handler_1.default)(async (req, res) => {
    const t = (0, perfLogger_1.createTimer)('getGlobalSync');
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const cacheKey = `sync_${userId || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        t.end({ source: 'cache' });
        res.json(cached);
        return;
    }
    // Backend Request Deduplication
    if (syncFetchInFlight.has(cacheKey)) {
        try {
            console.log(`[DEDUPLICATED] Sync request for ${userId} served from in-flight promise`);
            const data = await syncFetchInFlight.get(cacheKey);
            t.end({ source: 'deduplicated' });
            res.json(data);
            return;
        }
        catch (err) {
            // fall through
        }
    }
    const fetchPromise = (async () => {
        const statsQuery = {};
        const recentQuery = {};
        // Optimized visibility query using participantIds covering index
        const userIdObj = new mongoose_1.default.Types.ObjectId(userId);
        if (userRole === 'AGENT' || userRole === 'MARKETER' || userRole === 'VISA' || userRole === 'TICKETING') {
            statsQuery.participantIds = userIdObj;
            recentQuery.participantIds = userId;
        }
        else if (userRole === 'OPERATION' || userRole === 'ACCOUNT') {
            statsQuery.status = 'Booked';
            recentQuery.status = 'Booked';
        }
        // Only fetch bookings modified in the last 48 hours for "recent" list (indexed by updatedAt)
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
        recentQuery.updatedAt = { $gte: since };
        // Run all queries
        const [statsResult, recentBookings, notifications, agentsCount] = await Promise.all([
            Booking_1.default.aggregate([
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
            Booking_1.default.find(recentQuery)
                .select('uniqueCode status assignedToUserId contact destination travelDate amount createdAt travellers')
                .sort({ updatedAt: -1 }) // Sort by modified date for "sync"
                .limit(5)
                .populate('assignedToUserId', 'name')
                .lean(),
            Notification_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
            userRole === 'ADMIN' ? User_1.default.countDocuments({ role: 'AGENT' }) : Promise.resolve(0)
        ]);
        t.mark('dbQuery');
        const stats = statsResult.length > 0 ? {
            total: statsResult[0].total,
            booked: statsResult[0].booked,
            pending: statsResult[0].pending,
            working: statsResult[0].working,
            sent: statsResult[0].sent,
        } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };
        const mappedBookings = recentBookings.map(b => {
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
            id: n._id.toString(),
        }));
        const response = {
            stats: {
                ...stats,
                agents: agentsCount,
            },
            recentBookings: mappedBookings,
            notifications: mappedNotifications,
        };
        t.mark('formatResponse');
        return response;
    })();
    syncFetchInFlight.set(cacheKey, fetchPromise);
    try {
        const result = await fetchPromise;
        t.end({ source: 'db', bookingsCount: result.recentBookings.length });
        cache_1.default.set(cacheKey, result, 120); // Increased to 120s as per audit
        res.json(result);
    }
    finally {
        syncFetchInFlight.delete(cacheKey);
    }
});
