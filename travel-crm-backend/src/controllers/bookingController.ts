import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import Comment from '../models/Comment';
import Passenger from '../models/Passenger';
import User from '../models/User';
import Payment from '../models/Payment';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import appCache from '../utils/cache';
import { createTimer } from '../utils/perfLogger';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    assignBookingSchema,
    createCommentSchema,
    createPassengersSchema,
    updateBookingSchema,
    createPaymentSchema,
} from '../types';
import { extractTravelInfo } from '../utils/extractTravelInfo';

// Request deduplication for booking fetches
const bookingFetchInFlight = new Map<string, Promise<any>>();

// Background Operation Semaphore
let _bgOps = 0;
const MAX_BG = 2;

async function runBG(label: string, fn: () => Promise<void>): Promise<void> {
    if (_bgOps >= MAX_BG) {
        console.log(`[BG:SKIP] ${label} - Queue saturated`);
        return;
    }
    _bgOps++;
    const t = Date.now();
    try {
        await fn();
        console.log(`[BG:OK] ${label}: ${Date.now() - t}ms`);
    } catch (err: any) {
        console.error(`[BG:FAIL] ${label}:`, err.message);
    } finally {
        _bgOps--;
    }
}

const invalidateBookingCaches = () => {
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');
};

const recalcOutstanding = async (bookingId: string) => {
    const [payments, booking] = await Promise.all([
        Payment.find({ bookingId }).select('amount').lean(),
        Booking.findById(bookingId).select('totalAmount amount estimatedCosts').lean()
    ]);
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    if (booking) {
        let bookingTotal = booking.totalAmount || booking.amount || 0;
        if (booking.estimatedCosts && booking.estimatedCosts.length > 0) {
            bookingTotal = booking.estimatedCosts.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
        }
        const outstanding = Math.max(bookingTotal - totalPaid, 0);
        await Booking.updateOne({ _id: bookingId }, { $set: { outstanding, amount: bookingTotal, totalAmount: bookingTotal } });
    }
};

const getObjectIdString = (field: any): string | null => {
    if (!field) return null;
    return (field as any)._id?.toString() || field.toString();
};

// @desc    Get booking stats
export const getBookingStats = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `stats_${req.user?.id || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const query: any = {};
    const userGroups = req.user?.groups || [];
    if (req.user?.role !== 'ADMIN') {
        const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
        const isOperation = userGroups.some(g => g.toLowerCase().trim() === 'operation') || req.user?.role === 'OPERATION';
        if (isAccount || isOperation) { query.status = 'Booked'; }
        else if (req.user?.role === 'AGENT') { query.assignedToUserId = new mongoose.Types.ObjectId(req.user.id); }
        else if (req.user?.role === 'MARKETER') { query.createdByUserId = new mongoose.Types.ObjectId(req.user.id); }
    }

    const stats = await Booking.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: 1 }, booked: { $sum: { $cond: [{ $eq: ["$status", "Booked"] }, 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } }, working: { $sum: { $cond: [{ $eq: ["$status", "Working"] }, 1, 0] } }, sent: { $sum: { $cond: [{ $eq: ["$status", "Sent"] }, 1, 0] } } } }]);
    const result = stats.length > 0 ? { total: stats[0].total, booked: stats[0].booked, pending: stats[0].pending, working: stats[0].working, sent: stats[0].sent } : { total: 0, booked: 0, pending: 0, working: 0, sent: 0 };
    appCache.set(cacheKey, result, 300);
    res.json(result);
});

// @desc    Get recent bookings
export const getRecentBookings = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `recent_${req.user?.id || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const query: any = {};
    if (req.user?.role === 'AGENT') { query.assignedToUserId = req.user.id; }
    const bookings = await Booking.find(query).select('uniqueCode status assignedToUserId contact destination travelDate amount createdAt').sort({ createdAt: -1 }).limit(5).populate('assignedToUserId', 'name').lean();
    const mapped = bookings.map(b => ({ ...b, id: (b as any)._id.toString(), contactPerson: b.contact?.name, destinationCity: b.destination }));
    appCache.set(cacheKey, mapped, 60);
    res.json(mapped);
});

// @desc    Get all bookings
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, assignedTo, search, page = '1', limit = '15', myBookings, cursor } = req.query;
    const query: any = {};
    const userGroups = req.user?.groups || [];

    if (req.user?.role !== 'ADMIN') {
        const isAccount = userGroups.some(g => g.toLowerCase().trim() === 'account') || req.user?.role === 'ACCOUNT';
        if (isAccount) { query.status = 'Booked'; }
        else {
            query.$or = [{ participantIds: new mongoose.Types.ObjectId(req.user?.id) }, { assignedGroup: { $in: userGroups } }];
        }
    }

    if (myBookings === 'true') {
        const userId = new mongoose.Types.ObjectId(req.user?.id);
        if (query.$or) {
            const existingOr = query.$or;
            query.$and = [{ $or: existingOr }, { participantIds: userId }];
            delete query.$or;
        } else {
            query.participantIds = userId;
        }
    }

    if (status) {
        const statusArray = (status as string).split(',');
        query.status = { $in: statusArray };
    }

    if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        query.$or = [{ 'contact.name': searchRegex }, { uniqueCode: searchRegex }, { destination: searchRegex }];
    }

    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const skipNum = cursor ? 0 : (Math.max(parseInt(page as string, 10), 1) - 1) * limitNum;
    if (cursor && mongoose.Types.ObjectId.isValid(cursor as string)) { query._id = { $lt: new mongoose.Types.ObjectId(cursor as string) }; }

    const [total, rawBookings] = await Promise.all([
        Booking.countDocuments(query),
        Booking.find(query).sort({ _id: -1 }).skip(skipNum).limit(limitNum).populate('assignedToUserId', 'name').populate('createdByUserId', 'name').lean()
    ]);

    const result = {
        data: rawBookings.map(b => ({ ...b, id: b._id.toString(), contactPerson: b.contact?.name, destinationCity: b.destination })),
        meta: { total, page: parseInt(page as string, 10), limit: limitNum }
    };
    res.json(result);
});

// @desc    Get booking by ID
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const [booking, allHistory, payments, passengers] = await Promise.all([
        Booking.findById(id).populate('assignedToUserId', 'name role').populate('createdByUserId', 'name role').lean(),
        Comment.find({ bookingId: id }).populate('userId', 'name role').sort({ createdAt: -1 }).lean(),
        Payment.find({ bookingId: id }).sort({ date: -1 }).lean(),
        Passenger.find({ bookingId: id }).lean()
    ]);

    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    const unifiedTimeline = (allHistory || []).map((t: any) => {
        const agentName = t.userId?.name || 'User';
        const rawText = t.text || t.details || '';
        const formattedText = rawText.includes('Booking Assigned') || rawText.includes('Agent changed') ? rawText : `${agentName} : ${rawText}`;
        return { ...t, id: t._id?.toString(), type: t.type || 'comment', text: t.type === 'activity' ? undefined : formattedText, details: t.type === 'activity' ? formattedText : undefined };
    });

    res.json({ ...booking, id: booking._id.toString(), timeline: unifiedTimeline, payments, travelers: passengers });
});

// @desc    Create booking
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
    const primaryContactId = new mongoose.Types.ObjectId();
    const booking = await Booking.create({ ...req.body, primaryContactId, createdByUserId: req.user?.id, participantIds: [req.user?.id] });
    
    setImmediate(async () => {
        await PrimaryContact.create({ _id: primaryContactId, contactName: req.body.contactPerson, contactPhoneNo: req.body.contactNumber });
        await Comment.create({ bookingId: booking._id, userId: req.user?.id, type: 'activity', text: `Booking created for ${req.body.contactPerson || 'Customer'}` });
        await Comment.create({ bookingId: booking._id, userId: req.user?.id, type: 'activity', text: `Booking Assigned to ${booking.assignedGroup} by ${req.user?.name}(${req.user?.groups?.[0] || 'Admin'})` });
    });
    res.status(201).json(booking);
});

// @desc    Update booking
export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await Booking.findByIdAndUpdate(id, { $set: req.body }, { new: true }).lean();
    invalidateBookingCaches();
    res.json(updated);
});

// @desc    Delete booking
export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await Booking.deleteOne({ _id: id });
    setImmediate(async () => {
        await Promise.all([Comment.deleteMany({ bookingId: id }), Passenger.deleteMany({ bookingId: id }), Payment.deleteMany({ bookingId: id })]);
    });
    res.json({ message: 'Deleted' });
});

// @desc    Update status
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findById(id).lean();
    const oldStatus = booking?.status;
    const updated = await Booking.findByIdAndUpdate(id, { status }, { new: true }).lean();
    
    setImmediate(async () => {
        await Comment.create({ bookingId: id, userId: req.user?.id, type: 'activity', text: `Status updated from ${oldStatus} to ${status}` });
    });
    res.json(updated);
});

// @desc    Assign booking
export const assignBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { assignedToUserId } = req.body;
    const booking = await Booking.findById(id).lean();
    if (!booking) { res.status(404); throw new Error('Not found'); }

    const newAgent = await User.findById(assignedToUserId).lean();
    const newAgentName = newAgent?.name || 'Unassigned';
    const newAgentGroup = newAgent?.groups?.[0] || 'Admin';

    await Booking.updateOne({ _id: id }, { $set: { assignedToUserId, participantIds: [booking.createdByUserId, assignedToUserId].filter(Boolean) } });
    
    setImmediate(async () => {
        await Comment.create({ bookingId: id, userId: req.user?.id, type: 'activity', text: `Agent changed: ➔ ${newAgentName}(${newAgentGroup})` });
    });
    res.json({ message: 'Assigned' });
});

// @desc    Bulk actions
export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
    const { bookingIds, assignedToUserId } = req.body;
    await Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { assignedToUserId } });
    res.json({ message: 'Bulk assigned' });
});

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
    const { bookingIds } = req.body;
    await Booking.deleteMany({ _id: { $in: bookingIds } });
    res.json({ message: 'Bulk deleted' });
});

// @desc    Payments
export const addPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = await Payment.create({ ...req.body, bookingId: id });
    await recalcOutstanding(id);
    setImmediate(async () => {
        await Comment.create({ bookingId: id, userId: req.user?.id, type: 'activity', text: `Payment recorded via ${req.body.paymentMethod}` });
    });
    res.status(201).json(payment);
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
    const payments = await Payment.find({ bookingId: req.params.id }).sort({ date: -1 }).lean();
    res.json(payments);
});

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
    const { id, paymentId } = req.params;
    await Payment.deleteOne({ _id: paymentId });
    await recalcOutstanding(id);
    res.json({ message: 'Deleted' });
});

// @desc    Passengers
export const addPassengers = asyncHandler(async (req: Request, res: Response) => {
    const data = (Array.isArray(req.body) ? req.body : [req.body]).map(p => ({ ...p, bookingId: req.params.id }));
    const created = await Passenger.insertMany(data);
    res.status(201).json(created);
});

export const updatePassengers = asyncHandler(async (req: Request, res: Response) => {
    await Passenger.deleteMany({ bookingId: req.params.id });
    const data = (Array.isArray(req.body) ? req.body : [req.body]).map(p => ({ ...p, bookingId: req.params.id }));
    const created = await Passenger.insertMany(data);
    res.json(created);
});

// @desc    Misc
export const getCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await Booking.find({ travelDate: { $ne: null } }).select('uniqueCode destination travelDate status contact').lean();
    res.json(bookings);
});

export const getBookingActivity = asyncHandler(async (req: Request, res: Response) => {
    const history = await Comment.find({ bookingId: req.params.id }).populate('userId', 'name').sort({ createdAt: -1 }).lean();
    res.json(history);
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const comments = await Comment.find({ bookingId: req.params.id, type: 'comment' }).populate('userId', 'name role').sort({ createdAt: -1 }).lean();
    res.json(comments);
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
    const comment = await Comment.create({ bookingId: req.params.id, userId: req.user?.id, type: 'comment', text: req.body.text });
    res.status(201).json(comment);
});

export const verifyBooking = asyncHandler(async (req: Request, res: Response) => {
    const updated = await Booking.findByIdAndUpdate(req.params.id, { verified: req.body.verified }, { new: true }).lean();
    res.json(updated);
});
