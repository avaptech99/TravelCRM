"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentBreakdown = exports.getAgentAnalytics = exports.getRevenueTrends = exports.getPaymentAnalytics = exports.getBookingAnalytics = void 0;
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
                    {
                        $group: {
                            _id: { $cond: [{ $eq: ['$contact.interested', true] }, 'Yes', 'No'] },
                            count: { $sum: 1 }
                        }
                    }
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
// @desc    Get detailed payment breakdown (pending and received)
// @route   GET /api/analytics/payment-breakdown
// @access  Private/Admin
exports.getPaymentBreakdown = (0, express_async_handler_1.default)(async (req, res) => {
    // 1. Get Pending Bookings (outstanding > 0)
    const pendingBookings = await Booking_1.default.find({ outstanding: { $gt: 0 } })
        .select('uniqueCode contact amount outstanding')
        .sort({ outstanding: -1 })
        .limit(50)
        .lean();
    const pending = pendingBookings.map((b) => ({
        bookingId: b._id,
        uniqueCode: b.uniqueCode,
        contactPerson: b.contact?.name || 'Unknown',
        totalAmount: b.amount || 0,
        totalPaid: (b.amount || 0) - (b.outstanding || 0),
        outstanding: b.outstanding || 0
    }));
    // 2. Get Recent Received Payments
    const recentPayments = await Payment_1.default.find()
        .populate({
        path: 'bookingId',
        populate: { path: 'primaryContactId' }
    })
        .sort({ date: -1 })
        .limit(50)
        .lean();
    const received = recentPayments.map((p) => ({
        uniqueCode: p.bookingId?.uniqueCode || 'N/A',
        contactPerson: p.bookingId?.primaryContactId?.contactName || 'Unknown',
        companyName: p.bookingId?.primaryContactId?.companyName || '',
        paymentMethod: p.method || 'Unknown',
        amount: p.amount || 0,
        date: p.date
    }));
    // 3. Totals
    const totalPending = pending.reduce((sum, b) => sum + b.outstanding, 0);
    const totalReceived = received.reduce((sum, p) => sum + p.amount, 0);
    res.json({
        pending,
        totalPending,
        received,
        totalReceived
    });
});
