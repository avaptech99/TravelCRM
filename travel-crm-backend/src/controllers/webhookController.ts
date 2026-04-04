import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import User from '../models/User';
import Comment from '../models/Comment';
import appCache from '../utils/cache';

// Helper: Find or create a system user named "Phone Lead"
const getPhoneLeadUser = async () => {
    let user = await User.findOne({ email: 'phone-lead@system.internal' });
    if (!user) {
        // Create a system user (no real password, cannot login)
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
// @access  Public
export const handleMissedCallWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { number, name, type, receivedAt } = req.body;

    if (!number) {
        res.status(400);
        throw new Error('Phone number is required');
    }

    // Normalize number: remove spaces, dashes, and handle optional + prefix
    // Assuming simple normalization for lookup
    const normalizedNumber = number.replace(/[\s\-\(\)\+]/g, '');

    // Get "Phone Lead" system user
    const phoneLeadUser = await getPhoneLeadUser();

    // Check if the contact exists
    let contact = await PrimaryContact.findOne({ 
        contactPhoneNo: { $regex: new RegExp(normalizedNumber + '$') } 
    });

    if (contact) {
        // Find most recent booking for this contact
        const latestBooking = await Booking.findOne({ primaryContactId: contact._id }).sort({ createdAt: -1 });
        
        if (latestBooking) {
            // Add a note to existing booking
            await Comment.create({
                bookingId: latestBooking._id,
                createdById: phoneLeadUser._id,
                text: `Missed Call Activity: ${type} ${name ? `(${name})` : ''} at ${receivedAt || new Date().toLocaleString()}`,
            });
            
            res.status(200).json({ 
                success: true, 
                message: 'Missed call added as note to existing lead',
                contactId: contact._id,
                bookingId: latestBooking._id
            });
            return;
        }
    }

    // If contact not found OR no booking found for contact, create new lead
    const finalName = name || 'Phone Lead';
    
    // 1. Create PrimaryContact if it doesn't exist
    if (!contact) {
        contact = await PrimaryContact.create({
            contactName: finalName,
            contactPhoneNo: number, // Keep original or normalized? I'll keep original as it might contain +
            bookingType: 'Direct (B2C)',
            requirements: `Missed Call from ${finalName} at ${receivedAt || new Date().toLocaleString()}`,
        });
    }

    // 2. Create Booking
    const booking = await Booking.create({
        primaryContactId: contact._id,
        createdByUserId: phoneLeadUser._id,
        status: 'Pending',
        destination: null,
        flightFrom: null,
        flightTo: null,
        segments: [],
        assignedToUserId: null,
    });

    // Invalidate caches
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');

    res.status(200).json({
        success: true,
        message: 'New lead created from missed call',
        contactId: contact._id,
        bookingId: booking._id
    });
});
