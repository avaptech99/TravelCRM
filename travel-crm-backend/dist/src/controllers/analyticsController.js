"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentBreakdown = exports.getAgentAnalytics = exports.getRevenueTrends = exports.getPaymentAnalytics = exports.getBookingAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Payment_1 = __importDefault(require("../models/Payment"));
const cache_1 = require("../utils/cache");
// @desc    Get booking status analytics
// @route   GET /api/analytics/bookings
// @access  Private/Admin
exports.getBookingAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = cache_1.CK.analytics('bookings', req.query);
    const cached = (0, cache_1.cacheGet)(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    const matchQuery = {};
    if (fromDate || toDate) {
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        if ((start && !isNaN(start.getTime())) || (end && !isNaN(end.getTime()))) {
            matchQuery.createdAt = {};
            if (start && !isNaN(start.getTime()))
                matchQuery.createdAt.$gte = start;
            if (end && !isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                matchQuery.createdAt.$lte = end;
            }
        }
    }
    if (company) {
        matchQuery.company = company;
    }
    const stats = await Booking_1.default.aggregate([
        { $match: matchQuery },
        {
            $facet: {
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byType: [
                    { $group: { _id: { $arrayElemAt: ['$segments.tripType', 0] }, count: { $sum: 1 } } }
                ],
                byInterest: [
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
    (0, cache_1.cacheSet)(cacheKey, stats[0], cache_1.TTL.ANALYTICS_SHORT);
});
// @desc    Get payment and revenue analytics
// @route   GET /api/analytics/payments
// @access  Private/Admin
exports.getPaymentAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = cache_1.CK.analytics('payments', req.query);
    const cached = (0, cache_1.cacheGet)(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    const matchQuery = {};
    if (fromDate || toDate) {
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        if ((start && !isNaN(start.getTime())) || (end && !isNaN(end.getTime()))) {
            matchQuery.date = {};
            if (start && !isNaN(start.getTime()))
                matchQuery.date.$gte = start;
            if (end && !isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                matchQuery.date.$lte = end;
            }
        }
    }
    // Total collected from Payments (Filtered by company if provided)
    const paymentPipeline = [];
    if (company) {
        paymentPipeline.push({
            $lookup: {
                from: 'bookings',
                localField: 'bookingId',
                foreignField: '_id',
                as: 'booking'
            }
        });
        paymentPipeline.push({ $unwind: '$booking' });
        paymentPipeline.push({ $match: { 'booking.company': company } });
    }
    // Add date filter to payment pipeline
    if (Object.keys(matchQuery).length > 0) {
        paymentPipeline.push({ $match: matchQuery });
    }
    paymentPipeline.push({
        $group: {
            _id: null,
            totalCollected: { $sum: '$amount' },
            count: { $sum: 1 }
        }
    });
    // Total expected from Bookings (amount)
    const bookingMatch = {};
    if (fromDate || toDate) {
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        if ((start && !isNaN(start.getTime())) || (end && !isNaN(end.getTime()))) {
            bookingMatch.createdAt = {};
            if (start && !isNaN(start.getTime()))
                bookingMatch.createdAt.$gte = start;
            if (end && !isNaN(end.getTime())) {
                const e = new Date(end);
                e.setHours(23, 59, 59, 999);
                bookingMatch.createdAt.$lte = e;
            }
        }
    }
    if (company && company !== 'undefined' && company !== 'null') {
        bookingMatch.company = company;
    }
    const [paymentStats, bookingStats] = await Promise.all([
        Payment_1.default.aggregate(paymentPipeline),
        Booking_1.default.aggregate([
            { $match: bookingMatch },
            {
                $group: {
                    _id: null,
                    totalExpected: {
                        $sum: {
                            $convert: {
                                input: '$totalAmount',
                                to: 'double',
                                onError: 0,
                                onNull: 0
                            }
                        }
                    }
                }
            }
        ])
    ]);
    const result = {
        totalCollected: paymentStats[0]?.totalCollected || 0,
        totalExpected: bookingStats[0]?.totalExpected || 0,
        balance: (bookingStats[0]?.totalExpected || 0) - (paymentStats[0]?.totalCollected || 0),
        paymentCount: paymentStats[0]?.count || 0
    };
    res.json(result);
    (0, cache_1.cacheSet)(cacheKey, result, cache_1.TTL.ANALYTICS_LONG);
});
// @desc    Get revenue trends over time
// @route   GET /api/analytics/revenue-trends
// @access  Private/Admin
exports.getRevenueTrends = (0, express_async_handler_1.default)(async (req, res) => {
    const { interval = 'month', company } = req.query;
    const cacheKey = cache_1.CK.analytics('revenue', req.query);
    const cached = (0, cache_1.cacheGet)(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    let format = '%Y-%m';
    if (interval === 'day')
        format = '%Y-%m-%d';
    if (interval === 'week')
        format = '%G-W%V';
    const pipeline = [];
    // 1. More inclusive match to catch legacy strings
    pipeline.push({
        $match: {
            date: { $ne: null }
        }
    });
    if (company && company !== 'undefined' && company !== 'null') {
        pipeline.push({
            $lookup: {
                from: 'bookings',
                localField: 'bookingId',
                foreignField: '_id',
                as: 'booking'
            }
        });
        pipeline.push({ $unwind: '$booking' });
        pipeline.push({ $match: { 'booking.company': company } });
    }
    pipeline.push({
        $group: {
            _id: {
                $dateToString: {
                    format: format,
                    date: {
                        $convert: {
                            input: '$date',
                            to: 'date',
                            onError: new Date(),
                            onNull: new Date()
                        }
                    }
                }
            },
            revenue: {
                $sum: {
                    $convert: {
                        input: '$amount',
                        to: 'double',
                        onError: 0,
                        onNull: 0
                    }
                }
            }
        }
    });
    pipeline.push({ $sort: { _id: 1 } });
    const trends = await Payment_1.default.aggregate(pipeline);
    res.json(trends);
    (0, cache_1.cacheSet)(cacheKey, trends, cache_1.TTL.ANALYTICS_SHORT);
});
// @desc    Get agent performance analytics
// @route   GET /api/analytics/agents
// @access  Private/Admin
exports.getAgentAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = cache_1.CK.analytics('agents', req.query);
    const cached = (0, cache_1.cacheGet)(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    const matchQuery = {};
    if (fromDate || toDate) {
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        if ((start && !isNaN(start.getTime())) || (end && !isNaN(end.getTime()))) {
            matchQuery.createdAt = {};
            if (start && !isNaN(start.getTime()))
                matchQuery.createdAt.$gte = start;
            if (end && !isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                matchQuery.createdAt.$lte = end;
            }
        }
    }
    if (company && company !== 'undefined' && company !== 'null') {
        matchQuery.company = company;
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
                totalRevenue: {
                    $sum: {
                        $convert: {
                            input: '$totalAmount',
                            to: 'double',
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
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
    (0, cache_1.cacheSet)(cacheKey, agentStats, cache_1.TTL.ANALYTICS_SHORT);
});
// @desc    Get detailed payment breakdown (pending and received)
// @route   GET /api/analytics/payment-breakdown
// @access  Private/Admin
exports.getPaymentBreakdown = (0, express_async_handler_1.default)(async (req, res) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = cache_1.CK.analytics('payment_breakdown', req.query);
    const cached = (0, cache_1.cacheGet)(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    // 1. Get Pending Bookings (outstanding > 0) within date range
    const bookingQuery = {
        outstanding: { $gt: 0 },
        createdAt: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
        }
    };
    if (company && company !== 'undefined' && company !== 'null') {
        bookingQuery.company = company;
    }
    // 2. Get Recent Received Payments
    const paymentPipeline = [
        {
            $match: {
                date: {
                    $gte: new Date(fromDate),
                    $lte: new Date(toDate)
                }
            }
        },
        {
            $lookup: {
                from: 'bookings',
                localField: 'bookingId',
                foreignField: '_id',
                as: 'booking'
            }
        },
        { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } }
    ];
    if (company && company !== 'undefined' && company !== 'null') {
        paymentPipeline.push({ $match: { 'booking.company': company } });
    }
    paymentPipeline.push({ $sort: { date: -1 } });
    // Run both pending and received queries in parallel
    const [pendingBookings, recentPayments] = await Promise.all([
        Booking_1.default.find(bookingQuery)
            .select('uniqueCode contact amount outstanding company')
            .sort({ outstanding: -1 })
            .lean(),
        Payment_1.default.aggregate(paymentPipeline)
    ]);
    const pending = pendingBookings.map((b) => {
        const amount = typeof b.amount === 'string' ? parseFloat(b.amount) || 0 : b.amount || 0;
        const outstanding = typeof b.outstanding === 'string' ? parseFloat(b.outstanding) || 0 : b.outstanding || 0;
        return {
            bookingId: b._id,
            uniqueCode: b.uniqueCode,
            contactPerson: b.contact?.name || 'Unknown',
            companyName: b.company || '—',
            totalAmount: amount,
            totalPaid: Math.max(amount - outstanding, 0),
            outstanding: outstanding
        };
    });
    const received = recentPayments.map((p) => ({
        id: p._id.toString(),
        uniqueCode: p.booking?.uniqueCode || 'N/A',
        contactPerson: p.booking?.contact?.name || 'Unknown',
        companyName: p.booking?.company || '—',
        paymentMethod: p.paymentMethod || 'Unknown',
        amount: typeof p.amount === 'string' ? parseFloat(p.amount) || 0 : p.amount || 0,
        date: p.date
    }));
    // 3. Totals with explicit number conversion (calculated from FULL lists)
    const totalPending = pending.reduce((sum, b) => sum + (Number(b.outstanding) || 0), 0);
    const totalReceived = received.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const result = {
        pending,
        totalPending,
        received,
        totalReceived
    };
    res.json(result);
    (0, cache_1.cacheSet)(cacheKey, result, cache_1.TTL.ANALYTICS_SHORT);
});
