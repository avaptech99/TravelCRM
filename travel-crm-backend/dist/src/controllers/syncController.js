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
// Request deduplication for sync fetches
const syncFetchInFlight = new Map();
// @desc    Get combined dashboard data (stats + recent bookings + notifications)
// @route   GET /api/sync
// @access  Private
exports.getGlobalSync = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const cacheKey = `sync_${userId || 'all'}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    // Backend Request Deduplication
    if (syncFetchInFlight.has(cacheKey)) {
        try {
            console.log(`[DEDUPLICATED] Sync request for ${userId} served from in-flight promise`);
            const data = await syncFetchInFlight.get(cacheKey);
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
        if (userRole === 'AGENT') {
            const objId = new mongoose_1.default.Types.ObjectId(userId);
            statsQuery.$or = [{ assignedToUserId: objId }, { createdByUserId: objId }];
            recentQuery.$or = [{ assignedToUserId: userId }, { createdByUserId: userId }];
        }
        else if (userRole === 'MARKETER') {
            statsQuery.createdByUserId = new mongoose_1.default.Types.ObjectId(userId);
            recentQuery.createdByUserId = userId;
        }
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
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('assignedToUserId', 'name')
                .lean(),
            Notification_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
            userRole === 'ADMIN' ? User_1.default.countDocuments({ role: 'AGENT' }) : Promise.resolve(0)
        ]);
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
        cache_1.default.set(cacheKey, result, 120); // Increased to 120s as per audit
        res.json(result);
    }
    finally {
        syncFetchInFlight.delete(cacheKey);
    }
});
