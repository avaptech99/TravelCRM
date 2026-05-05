"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentAnalytics = exports.getRevenueTrends = exports.getPaymentAnalytics = exports.getBookingAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Payment_1 = __importDefault(require("../models/Payment"));
// @desc    Get booking status analytics
// @route   GET /api/analytics/bookings
// @access  Private/Admin
exports.getBookingAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const matchQuery = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate)
            matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate)
            matchQuery.createdAt.$lte = new Date(toDate);
    }
    const stats = await Booking_1.default.aggregate([
        { $match: matchQuery },
        {
            $facet: {
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byType: [
                    { $group: { _id: '$tripType', count: { $sum: 1 } } }
                ],
                byInterest: [
                    {
                        $lookup: {
                            from: 'primarycontacts',
                            localField: 'primaryContactId',
                            foreignField: '_id',
                            as: 'contact'
                        }
                    },
                    { $unwind: '$contact' },
                    { $group: { _id: '$contact.interested', count: { $sum: 1 } } }
                ]
            }
        }
    ]);
    res.json(stats[0]);
});
// @desc    Get payment and revenue analytics
// @route   GET /api/analytics/payments
// @access  Private/Admin
exports.getPaymentAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const matchQuery = {};
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate)
            matchQuery.date.$gte = new Date(fromDate);
        if (toDate)
            matchQuery.date.$lte = new Date(toDate);
    }
    // Total collected from Payments
    const paymentStats = await Payment_1.default.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalCollected: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    // Total expected from Bookings (amount)
    const bookingMatch = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate)
            bookingMatch.createdAt.$gte = new Date(fromDate);
        if (toDate)
            bookingMatch.createdAt.$lte = new Date(toDate);
    }
    const bookingStats = await Booking_1.default.aggregate([
        { $match: bookingMatch },
        {
            $group: {
                _id: null,
                totalExpected: { $sum: '$amount' }
            }
        }
    ]);
    res.json({
        totalCollected: paymentStats[0]?.totalCollected || 0,
        totalExpected: bookingStats[0]?.totalExpected || 0,
        balance: (bookingStats[0]?.totalExpected || 0) - (paymentStats[0]?.totalCollected || 0),
        paymentCount: paymentStats[0]?.count || 0
    });
});
// @desc    Get revenue trends over time
// @route   GET /api/analytics/revenue-trends
// @access  Private/Admin
exports.getRevenueTrends = (0, express_async_handler_1.default)(async (req, res) => {
    const { interval = 'month' } = req.query; // 'day' or 'month'
    const format = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';
    const trends = await Payment_1.default.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: format, date: '$date' } },
                revenue: { $sum: '$amount' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    res.json(trends);
});
// @desc    Get agent performance analytics
// @route   GET /api/analytics/agents
// @access  Private/Admin
exports.getAgentAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const matchQuery = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate)
            matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate)
            matchQuery.createdAt.$lte = new Date(toDate);
    }
    const agentStats = await Booking_1.default.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: 'users',
                localField: 'assignedToUserId',
                foreignField: '_id',
                as: 'agentDetails'
            }
        },
        { $unwind: { path: '$agentDetails', preserveNullAndEmptyArrays: true } },
        // Filter to only include bookings assigned to real agents
        {
            $match: {
                $and: [
                    { 'agentDetails._id': { $exists: true } }, // Must be assigned to a real user in the DB
                    { 'agentDetails.email': { $nin: ['phone-lead@system.internal', 'website-lead@system.internal'] } }
                ]
            }
        },
        {
            $group: {
                _id: { $ifNull: ['$assignedToUserId', 'unassigned'] }, // Group all nulls together
                agentName: { $first: { $ifNull: ['$agentDetails.name', 'Unassigned'] } },
                totalBookings: { $sum: 1 },
                convertedBookings: { $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] } },
                totalRevenue: { $sum: '$amount' }
            }
        },
        {
            $project: {
                _id: 1,
                agentName: 1,
                totalBookings: 1,
                convertedBookings: 1,
                totalRevenue: 1,
                conversionRate: {
                    $cond: [
                        { $gt: ['$totalBookings', 0] },
                        { $multiply: [{ $divide: ['$convertedBookings', '$totalBookings'] }, 100] },
                        0
                    ]
                }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);
    res.json(agentStats);
});
