import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Payment from '../models/Payment';
import User from '../models/User';
import mongoose from 'mongoose';
import appCache from '../utils/cache';

// @desc    Get booking status analytics
// @route   GET /api/analytics/bookings
// @access  Private/Admin
export const getBookingAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = `analytics_bookings_${fromDate || ''}_${toDate || ''}_${company || ''}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    
    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) {
            const end = new Date(toDate as string);
            end.setHours(23, 59, 59, 999);
            matchQuery.createdAt.$lte = end;
        }
    }
    if (company) {
        matchQuery.company = company as string;
    }

    const stats = await Booking.aggregate([
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

    appCache.set(cacheKey, stats[0], 120); // Reduced to 120s
});

// @desc    Get payment and revenue analytics
// @route   GET /api/analytics/payments
// @access  Private/Admin
export const getPaymentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = `analytics_payments_${fromDate || ''}_${toDate || ''}_${company || ''}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate) matchQuery.date.$gte = new Date(fromDate as string);
        if (toDate) {
            const end = new Date(toDate as string);
            end.setHours(23, 59, 59, 999);
            matchQuery.date.$lte = end;
        }
    }

    // Total collected from Payments (Filtered by company if provided)
    const paymentPipeline: any[] = [];
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

    const paymentStats = await Payment.aggregate(paymentPipeline);


    // Total expected from Bookings (amount)
    const bookingMatch: any = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate) bookingMatch.createdAt.$gte = new Date(fromDate as string);
        if (toDate) {
            const end = new Date(toDate as string);
            end.setHours(23, 59, 59, 999);
            bookingMatch.createdAt.$lte = end;
        }
    }
    if (company) {
        bookingMatch.company = company as string;
    }

    const bookingStats = await Booking.aggregate([
        { $match: bookingMatch },
        {
            $group: {
                _id: null,
                totalExpected: { $sum: '$amount' }
            }
        }
    ]);

    const result = {
        totalCollected: paymentStats[0]?.totalCollected || 0,
        totalExpected: bookingStats[0]?.totalExpected || 0,
        balance: (bookingStats[0]?.totalExpected || 0) - (paymentStats[0]?.totalCollected || 0),
        paymentCount: paymentStats[0]?.count || 0
    };
    res.json(result);
    appCache.set(cacheKey, result, 120); // Reduced to 120s
});

// @desc    Get revenue trends over time
// @route   GET /api/analytics/revenue-trends
// @access  Private/Admin
export const getRevenueTrends = asyncHandler(async (req: Request, res: Response) => {
    const { interval = 'month', company } = req.query;
    const cacheKey = `analytics_revenue_${interval}_${company || ''}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }

    let format = '%Y-%m';
    if (interval === 'day') format = '%Y-%m-%d';
    if (interval === 'week') format = '%G-W%V (%b)'; // e.g., 2024-W18 (May)

    const pipeline: any[] = [];
    
    if (company) {
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
            _id: { $dateToString: { format: format, date: '$date' } },
            revenue: { $sum: '$amount' }
        }
    });
    pipeline.push({ $sort: { _id: 1 } });

    const trends = await Payment.aggregate(pipeline);

    res.json(trends);
    appCache.set(cacheKey, trends, 120); 
});

// @desc    Get agent performance analytics
// @route   GET /api/analytics/agents
// @access  Private/Admin
export const getAgentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = `analytics_agents_${fromDate || ''}_${toDate || ''}_${company || ''}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) {
            const end = new Date(toDate as string);
            end.setHours(23, 59, 59, 999);
            matchQuery.createdAt.$lte = end;
        }
    }
    if (company) {
        matchQuery.company = company as string;
    }

    const agentStats = await Booking.aggregate([
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
    appCache.set(cacheKey, agentStats, 120); // Reduced to 120s
});

// @desc    Get detailed payment breakdown (pending and received)
// @route   GET /api/analytics/payment-breakdown
// @access  Private/Admin
export const getPaymentBreakdown = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, company } = req.query;
    const cacheKey = `analytics_payment_breakdown_${fromDate || ''}_${toDate || ''}_${company || ''}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.json(cached);
        return;
    }
    
    // 1. Get Pending Bookings (outstanding > 0)
    const bookingQuery: any = { outstanding: { $gt: 0 } };
    if (company) {
        bookingQuery.company = company as string;
    }

    const pendingBookings = await Booking.find(bookingQuery)
        .select('uniqueCode contact amount outstanding company')
        .sort({ outstanding: -1 })
        .limit(20) // Reduced from 50 for faster load
        .lean();


    const pending = pendingBookings.map((b: any) => ({
        bookingId: b._id,
        uniqueCode: b.uniqueCode,
        contactPerson: b.contact?.name || 'Unknown',
        companyName: b.company || '—',
        totalAmount: b.amount || 0,
        totalPaid: (b.amount || 0) - (b.outstanding || 0),
        outstanding: b.outstanding || 0
    }));

    // 2. Get Recent Received Payments
    const paymentPipeline: any[] = [
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

    if (company) {
        paymentPipeline.push({ $match: { 'booking.company': company } });
    }

    paymentPipeline.push({ $sort: { date: -1 } });
    paymentPipeline.push({ $limit: 100 });
    
    const recentPayments = await Payment.aggregate(paymentPipeline);

    const received = recentPayments.map((p: any) => ({
        id: p._id.toString(),
        uniqueCode: p.booking?.uniqueCode || 'N/A',
        contactPerson: p.booking?.contact?.name || 'Unknown',
        companyName: p.booking?.company || '—',
        paymentMethod: p.paymentMethod || 'Unknown',
        amount: p.amount || 0,
        date: p.date
    }));

    // 3. Totals
    const totalPending = pending.reduce((sum, b) => sum + b.outstanding, 0);
    const totalReceived = received.reduce((sum, p) => sum + p.amount, 0);

    const result = {
        pending,
        totalPending,
        received: received.slice(0, 20), // Reduced from 50 for faster load
        totalReceived
    };


    res.json(result);
    appCache.set(cacheKey, result, 120); // Reduced to 120s
});
