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
            $lookup: {
                from: 'contacts',
                localField: 'contactId',
                foreignField: '_id',
                as: 'contact'
            }
        },
        { $unwind: { path: '$contact', preserveNullAndEmptyArrays: true } },
        {
            $facet: {
                byStatus: [
                    { $group: { _id: '$contact.status', count: { $sum: 1 } } }
                ],
                byType: [
                    { $group: { _id: '$tripType', count: { $sum: 1 } } }
                ],
                byInterest: [
                    { $group: { _id: { $ifNull: ['$contact.interested', 'No'] }, count: { $sum: 1 } } }
                ],
                uniqueLeads: [
                    { $group: { _id: '$contactId' } },
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
                totalExpected: { $sum: '$lumpSumAmount' },
                count: { $sum: 1 }
            }
        }
    ]);

    // Aggregate Costs for Margins (Step 3: Query costs collection)
    const bookingIds = await Booking.find(bookingMatch).distinct('_id');
    
    const costStats = await mongoose.model('Cost').aggregate([
        { $match: { bookingId: { $in: bookingIds } } },
        {
            $group: {
                _id: '$costKind',
                total: { $sum: '$price' }
            }
        }
    ]);

    const estimatedCosts = costStats.find(c => c._id === 'estimated')?.total || 0;
    const actualCosts = costStats.find(c => c._id === 'actual')?.total || 0;

    res.json({
        totalCollected: paymentStats[0]?.totalCollected || 0,
        totalExpected: bookingStats[0]?.totalExpected || 0,
        balance: (bookingStats[0]?.totalExpected || 0) - (paymentStats[0]?.totalCollected || 0),
        paymentCount: paymentStats[0]?.count || 0,
        bookingCount: bookingStats[0]?.count || 0,
        estimatedCosts,
        actualCosts,
        estimatedMargin: (bookingStats[0]?.totalExpected || 0) - estimatedCosts,
        netMargin: (bookingStats[0]?.totalExpected || 0) - actualCosts
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
                from: 'contacts',
                localField: 'contactId',
                foreignField: '_id',
                as: 'contact'
            }
        },
        { $unwind: { path: '$contact', preserveNullAndEmptyArrays: true } },
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
                convertedBookings: { $sum: { $cond: [{ $eq: ['$contact.status', 'Booked'] }, 1, 0] } },
                totalRevenue: { $sum: '$lumpSumAmount' }
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

// @desc    Get payment breakdown (pending vs received)
// @route   GET /api/analytics/payment-breakdown
// @access  Private/Admin
export const getPaymentBreakdown = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, companyName } = req.query;

    const bookingMatch: any = {};
    if (fromDate || toDate) {
        bookingMatch.createdAt = {};
        if (fromDate) bookingMatch.createdAt.$gte = new Date(fromDate as string);
        if (toDate) bookingMatch.createdAt.$lte = new Date(toDate as string);
    }
    if (companyName) {
        bookingMatch.companyName = { $regex: new RegExp(companyName as string, 'i') };
    }

    // Get all bookings, populate contact to filter by status
    const allBookings = await Booking.find(bookingMatch)
        .populate('contactId', 'contactName contactPhoneNo status')
        .populate('payments')
        .sort({ createdAt: -1 })
        .lean();
    
    const bookings = allBookings.filter(b => (b as any).contactId?.status === 'Booked');

    const pending: any[] = [];
    const received: any[] = [];
    let totalPending = 0;
    let totalReceived = 0;

    for (const b of bookings) {
        const payments = (b as any).payments || [];
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const bookingTotal = (b as any).lumpSumAmount || 0;
        const outstanding = Math.max(bookingTotal - totalPaid, 0);

        const bookingInfo = {
            bookingId: b._id,
            uniqueCode: b.uniqueCode,
            contactPerson: (b as any).contactId?.contactName || 'N/A',
            contactNumber: (b as any).contactId?.contactPhoneNo || '',
            companyName: b.companyName || '',
            totalAmount: bookingTotal,
            totalPaid,
            outstanding,
            createdAt: b.createdAt,
        };

        if (outstanding > 0) {
            pending.push(bookingInfo);
            totalPending += outstanding;
        }

        // Add each received payment as a row
        for (const p of payments) {
            received.push({
                bookingId: b._id,
                uniqueCode: b.uniqueCode,
                contactPerson: (b as any).contactId?.contactName || 'N/A',
                companyName: b.companyName || '',
                amount: p.amount,
                paymentMethod: p.paymentMethod,
                date: p.date,
                transactionId: p.transactionId || '',
            });
            totalReceived += p.amount || 0;
        }
    }

    res.json({ pending, received, totalPending, totalReceived });
});
// @desc    Get query grouping by contact number
// @route   GET /api/analytics/query-grouping
// @access  Private/Admin
export const getQueryGrouping = asyncHandler(async (req: Request, res: Response) => {
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

    const groupedData = await Booking.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: 'contacts',
                localField: 'contactId',
                foreignField: '_id',
                as: 'contact'
            }
        },
        { $unwind: '$contact' },
        {
            $group: {
                _id: '$contact.contactPhoneNo',
                contactName: { $first: '$contact.contactName' },
                bookings: {
                    $push: {
                        _id: '$_id',
                        uniqueCode: '$uniqueCode',
                        status: '$contact.status',
                        createdAt: '$createdAt',
                        destination: '$destination',
                        amount: '$lumpSumAmount'
                    }
                },
                count: { $sum: 1 }
            }
        },
        { $match: { count: { $gt: 1 } } }, // Only show those with multiple queries as per requirement
        { $sort: { count: -1 } }
    ]);

    res.json(groupedData);
});
