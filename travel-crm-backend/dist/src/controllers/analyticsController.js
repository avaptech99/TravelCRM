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
    const { fromDate, toDate, companyName } = req.query;
    const matchQuery = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate)
            matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate)
            matchQuery.createdAt.$lte = new Date(toDate);
    }
    if (companyName) {
        matchQuery.companyName = { $regex: new RegExp(companyName, 'i') };
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
                    { $unwind: { path: '$contact', preserveNullAndEmptyArrays: true } },
                    { $group: { _id: '$contact.interested', count: { $sum: 1 } } }
                ],
                uniqueLeads: [
                    { $group: { _id: '$primaryContactId' } },
                    { $count: 'count' }
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
    const { fromDate, toDate, companyName } = req.query;
    const matchQuery = {};
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate)
            matchQuery.date.$gte = new Date(fromDate);
        if (toDate)
            matchQuery.date.$lte = new Date(toDate);
    }
    const paymentPipeline = [];
    // If companyName is provided, we need to join Booking to filter Payments by Company
    if (companyName) {
        paymentPipeline.push({
            $lookup: {
                from: 'bookings',
                localField: 'bookingId',
                foreignField: '_id',
                as: 'booking'
            }
        });
        paymentPipeline.push({ $unwind: '$booking' });
        paymentPipeline.push({
            $match: { 'booking.companyName': { $regex: new RegExp(companyName, 'i') } }
        });
    }
    paymentPipeline.push({ $match: matchQuery });
    paymentPipeline.push({
        $group: {
            _id: null,
            totalCollected: { $sum: '$amount' },
            count: { $sum: 1 }
        }
    });
    const paymentStats = await Payment_1.default.aggregate(paymentPipeline);
    // Total expected from Bookings (amount)
    const bookingMatch = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate)
            bookingMatch.createdAt.$gte = new Date(fromDate);
        if (toDate)
            bookingMatch.createdAt.$lte = new Date(toDate);
    }
    if (companyName) {
        bookingMatch.companyName = { $regex: new RegExp(companyName, 'i') };
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
    const { interval = 'month', companyName } = req.query; // 'day' or 'month'
    const format = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';
    const pipeline = [];
    // If companyName is provided, we need to join Booking to filter Payments by Company
    if (companyName) {
        pipeline.push({
            $lookup: {
                from: 'bookings',
                localField: 'bookingId',
                foreignField: '_id',
                as: 'booking'
            }
        });
        pipeline.push({ $unwind: '$booking' });
        pipeline.push({
            $match: { 'booking.companyName': { $regex: new RegExp(companyName, 'i') } }
        });
    }
    pipeline.push({
        $group: {
            _id: { $dateToString: { format: format, date: '$date' } },
            revenue: { $sum: '$amount' }
        }
    });
    pipeline.push({ $sort: { _id: 1 } });
    const trends = await Payment_1.default.aggregate(pipeline);
    res.json(trends);
});
// @desc    Get agent performance analytics
// @route   GET /api/analytics/agents
// @access  Private/Admin
exports.getAgentAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate, companyName } = req.query;
    const matchQuery = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate)
            matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate)
            matchQuery.createdAt.$lte = new Date(toDate);
    }
    if (companyName) {
        matchQuery.companyName = { $regex: new RegExp(companyName, 'i') };
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
