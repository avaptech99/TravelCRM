import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import User from '../models/User';
import Comment from '../models/Comment';
import Notification from '../models/Notification';
import MissedCall from '../models/MissedCall';
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

// Helper: Format date only — "4/4/2026"
const formatDate = (date: Date): string => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Helper: Format time only — "14:15"
const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Core: Process a single call into the CRM
const processCallIntoCRM = async (
    callerNumber: string,
    callerName: string,
    callTime: Date,
    endTime: Date | null,
    duration: number,
    billsec: number,
    disposition: string
) => {
    const phoneLeadUser = await getPhoneLeadUser();

    // Normalize number for lookup (strip spaces, dashes, + etc.)
    const normalizedNumber = callerNumber.replace(/[\s\-\(\)\+]/g, '');

    // Check CRM for existing contact
    let contact = await PrimaryContact.findOne({
        contactPhoneNo: { $regex: new RegExp(normalizedNumber + '$') },
    });

    // Determine name: Prioritize CRM name > caller name from PBX > "Unknown"
    let finalName = 'Unknown';
    if (contact && contact.contactName) {
        finalName = contact.contactName;
    } else if (callerName && callerName !== callerNumber) {
        finalName = callerName;
    }

    // Build call type label
    const callType = (disposition === 'ANSWERED' && billsec > 0) ? 'Answered Call' : 'Missed Call';

    // Format times
    const dateStr = formatDate(callTime);
    const startStr = formatTime(callTime);
    const endStr = endTime ? formatTime(endTime) : 'N/A';

    // Build detailed comment text
    const commentText = `${callType} from ${finalName} on ${dateStr} | Start: ${startStr} | End: ${endStr} | Duration: ${duration}s | Billsec: ${billsec}s`;

    // Existing contact — add comment to latest booking + notify agent
    if (contact) {
        const latestBooking = await Booking.findOne({ primaryContactId: contact._id }).sort({ createdAt: -1 });
        if (latestBooking) {
            await Comment.create({
                bookingId: latestBooking._id,
                createdById: phoneLeadUser._id,
                text: commentText,
            });

            // Notify assigned agent
            if (latestBooking.assignedToUserId) {
                await Notification.create({
                    userId: latestBooking.assignedToUserId,
                    bookingId: latestBooking._id,
                    message: `Missed call from ${finalName} (${contact.contactPhoneNo}) on your lead ${latestBooking.uniqueCode}.`,
                });
                appCache.invalidateByPrefix(`notifications_${latestBooking.assignedToUserId}`);
            }

            appCache.invalidateByPrefix('bookings_');
            return { action: 'comment_added', contactId: contact._id, bookingId: latestBooking._id };
        }
    }

    // New contact — create lead
    if (!contact) {
        contact = await PrimaryContact.create({
            contactName: finalName,
            contactPhoneNo: callerNumber,
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
        callDisposition: (disposition === 'ANSWERED' && billsec > 0) ? 'ANSWERED' : 'MISSED'
    });

    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');

    return { action: 'lead_created', contactId: contact._id, bookingId: booking._id };
};

// @desc    Receive CDR webhook from GDMS/UCM
// @route   POST /api/webhook/missed-call
// @access  Protected by HTTP Basic Auth
export const receiveMissedCall = asyncHandler(async (req: Request, res: Response) => {
    // ---- HTTP Basic Auth ----
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.status(401).setHeader('WWW-Authenticate', 'Basic realm="GDMS Webhook"');
        throw new Error('Unauthorized: Missing credentials');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    const expectedUser = process.env.GDMS_WEBHOOK_USER;
    const expectedPass = process.env.GDMS_WEBHOOK_PASS;

    if (!expectedUser || !expectedPass || username !== expectedUser || password !== expectedPass) {
        res.status(401);
        throw new Error('Unauthorized: Invalid credentials');
    }

    // ---- Parse CDR payload (flexible format detection) ----
    console.log('[GDMS Webhook] Raw payload received:', JSON.stringify(req.body, null, 2));

    let cdrRoot: any[] = [];

    if (req.body.cdr_root && Array.isArray(req.body.cdr_root)) {
        cdrRoot = req.body.cdr_root;
    } else if (Array.isArray(req.body)) {
        cdrRoot = req.body;
    } else if (req.body.src || req.body.uniqueid) {
        cdrRoot = [req.body];
    } else {
        const arrayKey = Object.keys(req.body).find(key => Array.isArray(req.body[key]));
        if (arrayKey) {
            cdrRoot = req.body[arrayKey];
            console.log(`[GDMS Webhook] Found CDR data under key: "${arrayKey}"`);
        }
    }

    if (cdrRoot.length === 0) {
        console.error('[GDMS Webhook] Could not parse CDR data. Raw body keys:', Object.keys(req.body));
        res.status(200).json({
            success: true,
            message: 'Payload received but no CDR records found. Raw payload logged.',
            rawKeys: Object.keys(req.body),
        });
        return;
    }

    let processedCount = 0;
    let skippedCount = 0;

    for (const cdr of cdrRoot) {
        // Parse call metadata
        const disposition = (cdr.disposition || '').toUpperCase();
        const billsec = parseInt(cdr.billsec || '0', 10);

        const uniqueId = cdr.uniqueid || cdr.uniqueId;
        if (!uniqueId) {
            skippedCount++;
            continue;
        }

        // Deduplicate: skip only if we already processed this CDR into the CRM
        const existing = await MissedCall.findOne({ uniqueId });
        if (existing && existing.isProcessed) {
            skippedCount++;
            continue;
        }

        const callerNumber = cdr.src || '';
        const callerName = cdr.caller_name || cdr.src || '';
        const callTime = cdr.start ? new Date(cdr.start) : new Date();
        const endTime = cdr.end ? new Date(cdr.end) : null;
        const duration = parseInt(cdr.duration || '0', 10);

        if (!callerNumber) {
            skippedCount++;
            continue;
        }

        try {
            // 1. Process into CRM (add comment or create lead)
            const result = await processCallIntoCRM(callerNumber, callerName, callTime, endTime, duration, billsec, disposition);
            console.log(`[GDMS Webhook] ${result.action} for ${callerNumber} (${disposition})`);

            // 2. Save/update MissedCall log and mark as processed
            await MissedCall.findOneAndUpdate(
                { uniqueId },
                {
                    callerNumber,
                    callerName,
                    calledNumber: cdr.dst || '',
                    callTime,
                    endTime,
                    duration: parseInt(cdr.duration || '0', 10),
                    billsec,
                    disposition: cdr.disposition || 'UNKNOWN',
                    uniqueId,
                    channel: cdr.channel || '',
                    userfield: cdr.userfield || '',
                    rawPayload: cdr,
                    isProcessed: true,
                },
                { upsert: true, new: true }
            );

            processedCount++;
        } catch (err: any) {
            console.error(`[GDMS Webhook] Error processing CDR ${uniqueId}:`, err.message);
        }
    }

    console.log(`[GDMS Webhook] Processed ${cdrRoot.length} CDRs: ${processedCount} integrated, ${skippedCount} skipped`);

    res.status(200).json({
        success: true,
        message: `Processed ${cdrRoot.length} CDR records`,
        integrated: processedCount,
        skipped: skippedCount,
    });
});
