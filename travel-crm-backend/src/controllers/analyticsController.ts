import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Payment from '../models/Payment';
import User from '../models/User';
import mongoose from 'mongoose';

// @desc    Get booking status analytics
// @route   GET /api/analytics/bookings
// @access  Private/Admin
export const getBookingAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    
    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate as string);
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
export const getPaymentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate) matchQuery.date.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.date.$lte = new Date(toDate as string);
    }

    // Total collected from Payments
    const paymentStats = await Payment.aggregate([
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
    const bookingMatch: any = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate) bookingMatch.createdAt.$gte = new Date(fromDate as string);
        if (toDate) bookingMatch.createdAt.$lte = new Date(toDate as string);
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
export const getRevenueTrends = asyncHandler(async (req: Request, res: Response) => {
    const { interval = 'month' } = req.query; // 'day' or 'month'

    const format = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const trends = await Payment.aggregate([
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
export const getAgentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate as string);
    }

    const agentStats = await Booking.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$assignedToUserId',
                totalBookings: { $sum: 1 },
                convertedBookings: { $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] } },
                totalRevenue: { $sum: '$amount' }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'agentDetails'
            }
        },
        { $unwind: { path: '$agentDetails', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                agentName: { $ifNull: ['$agentDetails.name', 'Unassigned'] },
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
