import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import User from '../models/User';
import Comment from '../models/Comment';
import Notification from '../models/Notification';
import appCache from '../utils/cache';

// Helper: Find or create a system user named "Phone Lead"
const getPhoneLeadUser = async () => {
    let user = await User.findOne({ email: 'phone-lead@system.internal' });
    if (!user) {
        user = await User.create({
            name: 'Phone Lead',
            email: 'phone-lead@system.internal',
            passwordHash: 'PHONE_LEAD_SYSTEM_NO_LOGIN',
            role: 'AGENT',
        });
    }
    return user;
};

// @desc    Handle missed call webhook from MacroDroid
// @route   POST /api/webhook/missed-call
export const handleMissedCallWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { number, name, receivedAt } = req.body;

    if (!number) {
        res.status(400);
        throw new Error('Phone number is required');
    }

    // 1. Prepare system data
    const normalizedNumber = number.replace(/[\s\-\(\)\+]/g, '');
    const phoneLeadUser = await getPhoneLeadUser();

    // 2. Check CRM for existing contact
    let contact = await PrimaryContact.findOne({ 
        contactPhoneNo: { $regex: new RegExp(normalizedNumber + '$') } 
    });

    // 3. Determine Name: Prioritize CRM name, then incoming name, fallback to "Unknown"
    let finalName = 'Unknown';
    if (contact && contact.contactName) {
        finalName = contact.contactName; 
    } else if (name && typeof name === 'string' && !name.toLowerCase().includes('unknown caller')) {
        finalName = name;
    }

    // 4. Format Date: 2026-04-04 13:58 -> 13:58 4/4/2026
    const formatDateTime = (raw: string) => {
        if (!raw || typeof raw !== 'string' || !raw.includes(' ')) return raw || new Date().toLocaleString();
        try {
            const [d, t] = raw.split(' ');
            const [y, m, day] = d.split('-');
            return `${t} ${parseInt(day)}/${parseInt(m)}/${y}`;
        } catch (e) {
            return raw;
        }
    };

    const displayTime = formatDateTime(receivedAt);
    const commentText = `Miss Call from ${finalName} , ${displayTime}`;

    // 5. Handle existing contact: Add comment and Notify agent
    if (contact) {
        const latestBooking = await Booking.findOne({ primaryContactId: contact._id }).sort({ createdAt: -1 });
        if (latestBooking) {
            await Comment.create({
                bookingId: latestBooking._id,
                createdById: phoneLeadUser._id,
                text: commentText,
            });
            
            if (latestBooking.assignedToUserId) {
                await Notification.create({
                    userId: latestBooking.assignedToUserId,
                    bookingId: latestBooking._id,
                    message: `Missed call from ${finalName} (${contact.contactPhoneNo}) for your assigned lead ${latestBooking.uniqueCode}.`,
                });
                appCache.invalidateByPrefix(`notifications_${latestBooking.assignedToUserId}`);
            }
            
            appCache.invalidateByPrefix('bookings_');
            res.status(200).json({ success: true, message: 'Comment added to existing lead' });
            return;
        }
    }

    // 6. Create new Lead if contact/booking not found
    if (!contact) {
        contact = await PrimaryContact.create({
            contactName: finalName,
            contactPhoneNo: number,
            bookingType: 'Direct (B2C)',
            requirements: commentText,
        });
    }

    const booking = await Booking.create({
        primaryContactId: contact._id,
        createdByUserId: phoneLeadUser._id,
        status: 'Pending',
        destination: null,
        flightFrom: null,
        flightTo: null,
        segments: [],
    });

    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');

    res.status(200).json({ success: true, message: 'New lead created' });
});
