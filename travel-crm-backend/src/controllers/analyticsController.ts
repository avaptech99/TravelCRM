import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Payment from '../models/Payment';
import User from '../models/User';
import mongoose from 'mongoose';
import cache from '../utils/cache';

// @desc    Get booking status analytics
// @route   GET /api/analytics/bookings
// @access  Private/Admin
export const getBookingAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, companyName = '' } = req.query;
    
    const cacheKey = `analytics_bookings_${fromDate}_${toDate}_${companyName}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        res.json(cached);
        return;
    }

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        matchQuery.companyName = companyName;
    }

    const stats = await Booking.aggregate([
        { $match: matchQuery },
        {
            $project: {
                status: 1,
                tripType: 1,
                'contact.interested': 1,
                createdAt: 1,
                companyName: 1
            }
        },
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

    const result = stats[0] || { byStatus: [], byType: [], byInterest: [] };
    cache.set(cacheKey, result, 300);
    res.json(result);
});

// @desc    Get payment and revenue analytics
// @route   GET /api/analytics/payments
// @access  Private/Admin
export const getPaymentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, companyName = '' } = req.query;

    const cacheKey = `analytics_payments_${fromDate}_${toDate}_${companyName}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        res.json(cached);
        return;
    }

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate) matchQuery.date.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.date.$lte = new Date(toDate as string);
    }

    // Total collected from Payments
    const paymentStats = await Payment.aggregate([
        { $match: matchQuery },
        { $project: { amount: 1, date: 1 } },
        {
            $group: {
                _id: null,
                totalCollected: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    // Total expected from Bookings (amount)
    const bookingMatch: any = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate) bookingMatch.createdAt.$gte = new Date(fromDate as string);
        if (toDate) bookingMatch.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        bookingMatch.companyName = companyName;
    }

    const bookingStats = await Booking.aggregate([
        { $match: bookingMatch },
        { $project: { amount: 1, createdAt: 1, companyName: 1 } },
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

    cache.set(cacheKey, result, 300);
    res.json(result);
});

// @desc    Get revenue trends over time
// @route   GET /api/analytics/revenue-trends
// @access  Private/Admin
export const getRevenueTrends = asyncHandler(async (req: Request, res: Response) => {
    const { interval = 'month', companyName = '' } = req.query; // 'day' or 'month'

    const cacheKey = `analytics_revenue_${interval}_${companyName}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        res.json(cached);
        return;
    }

    const format = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const trends = await Payment.aggregate([
        { $project: { amount: 1, date: 1 } },
        {
            $group: {
                _id: { $dateToString: { format: format, date: '$date' } },
                revenue: { $sum: '$amount' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const result = trends ?? [];
    cache.set(cacheKey, result, 300);
    res.json(result);
});

// @desc    Get agent performance analytics
// @route   GET /api/analytics/agents
// @access  Private/Admin
export const getAgentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, companyName = '' } = req.query;

    const cacheKey = `analytics_agents_${fromDate}_${toDate}_${companyName}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        res.json(cached);
        return;
    }

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        matchQuery.companyName = companyName;
    }

    const agentStats = await Booking.aggregate([
        { $match: matchQuery },
        {
            $project: {
                assignedToUserId: 1,
                status: 1,
                amount: 1,
                createdAt: 1,
                companyName: 1
            }
        },
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

    const result = agentStats ?? [];
    cache.set(cacheKey, result, 300);
    res.json(result);
});

// @desc    Get detailed payment breakdown (pending and received)
// @route   GET /api/analytics/payment-breakdown
// @access  Private/Admin
export const getPaymentBreakdown = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate = '', toDate = '', companyName = '' } = req.query;
    
    const cacheKey = `analytics_breakdown_${fromDate}_${toDate}_${companyName}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        res.json(cached);
        return;
    }

    // 1. Get Pending Bookings (outstanding > 0)
    const pendingBookings = await Booking.find({ outstanding: { $gt: 0 } })
        .select('uniqueCode contact amount outstanding')
        .sort({ outstanding: -1 })
        .limit(50)
        .lean();

    const pending = pendingBookings.map((b: any) => ({
        bookingId: b._id,
        uniqueCode: b.uniqueCode,
        contactPerson: b.contact?.name || 'Unknown',
        totalAmount: b.amount || 0,
        totalPaid: (b.amount || 0) - (b.outstanding || 0),
        outstanding: b.outstanding || 0
    }));

    // 2. Get Recent Received Payments
    const recentPayments = await Payment.find()
        .populate({
            path: 'bookingId',
            populate: { path: 'primaryContactId' }
        })
        .sort({ date: -1 })
        .limit(50)
        .lean();

    const received = recentPayments.map((p: any) => ({
        uniqueCode: p.bookingId?.uniqueCode || 'N/A',
        contactPerson: p.bookingId?.contact?.name || 'Unknown',
        companyName: p.bookingId?.contact?.company || '',
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
        received,
        totalReceived
    };

    cache.set(cacheKey, result, 300);
    res.json(result);
});
