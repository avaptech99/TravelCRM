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
    // Run all queries in parallel
    const [statsResult, recentBookings, notifications, agentsData] = await Promise.all([
        // 1. Stats aggregation
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
        // 2. Recent bookings (latest 5)
        Booking_1.default.find(recentQuery)
            .select('uniqueCode status assignedToUserId contact destination travelDate amount createdAt travellers')
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('assignedToUser', 'name')
            .lean(),
        // 3. Notifications (latest 20)
        Notification_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
        // 4. Agent count (admin only)
        userRole === 'ADMIN'
            ? User_1.default.find({ role: 'AGENT' }).select('_id').lean()
            : Promise.resolve([]),
    ]);
    const stats = statsResult.length > 0 ? {
        total: statsResult[0].total,
        booked: statsResult[0].booked,
        pending: statsResult[0].pending,
        working: statsResult[0].working,
        sent: statsResult[0].sent,
    } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };
    const mappedBookings = recentBookings.map(b => ({
        ...b,
        id: b._id.toString(),
        contactPerson: b.contact?.name,
        contactNumber: b.contact?.phone,
        bookingType: b.contact?.type === 'Agent (B2B)' ? 'B2B' : 'B2C',
        destinationCity: b.destination,
        travellers: b.travellers,
    }));
    const mappedNotifications = notifications.map(n => ({
        ...n,
        id: n._id.toString(),
    }));
    const result = {
        stats: {
            ...stats,
            agents: agentsData.length,
        },
        recentBookings: mappedBookings,
        notifications: mappedNotifications,
    };
    cache_1.default.set(cacheKey, result, 30); // Cache for 30 seconds
    res.json(result);
});
