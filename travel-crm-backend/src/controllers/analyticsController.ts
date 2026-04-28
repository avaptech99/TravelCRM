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
    const { fromDate, toDate, companyName } = req.query;
    
    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        matchQuery.companyName = { $regex: new RegExp(companyName as string, 'i') };
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
export const getPaymentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, companyName } = req.query;

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate) matchQuery.date.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.date.$lte = new Date(toDate as string);
    }

    const paymentPipeline: any[] = [];

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
            $match: { 'booking.companyName': { $regex: new RegExp(companyName as string, 'i') } }
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

    const paymentStats = await Payment.aggregate(paymentPipeline);

    // Total expected from Bookings (amount)
    const bookingMatch: any = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate) bookingMatch.createdAt.$gte = new Date(fromDate as string);
        if (toDate) bookingMatch.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        bookingMatch.companyName = { $regex: new RegExp(companyName as string, 'i') };
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
    const { interval = 'month', companyName } = req.query; // 'day' or 'month'

    const format = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const pipeline: any[] = [];

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
            $match: { 'booking.companyName': { $regex: new RegExp(companyName as string, 'i') } }
        });
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
});

// @desc    Get agent performance analytics
// @route   GET /api/analytics/agents
// @access  Private/Admin
export const getAgentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, companyName } = req.query;

    const matchQuery: any = {};
    if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate as string);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        matchQuery.companyName = { $regex: new RegExp(companyName as string, 'i') };
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
});
