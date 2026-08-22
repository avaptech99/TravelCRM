import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import User from '../models/User';
import Comment from '../models/Comment';
import Notification from '../models/Notification';
import MissedCall from '../models/MissedCall';
import appCache, { CacheInvalidation } from '../utils/cache';

// ponytail: Helper for Phone Lead system user
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

const formatDate = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
const formatTime = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const processCallIntoCRM = async (
    callerNumber: string,
    callerName: string,
    callTime: Date,
    endTime: Date | null,
    duration: number,
    billsec: number,
    disposition: string,
    pbxCallId: string
) => {
    const phoneLeadUser = await getPhoneLeadUser();
    const normalizedNumber = callerNumber.replace(/[\s\-\(\)\+]/g, '');

    let contact = await PrimaryContact.findOne({
        contactPhoneNo: { $regex: new RegExp(normalizedNumber + '$') },
    });

    let finalName = 'Unknown';
    if (contact && contact.contactName) {
        finalName = contact.contactName;
    } else if (callerName && callerName !== callerNumber) {
        finalName = callerName;
    }

    let callType = 'Missed Call';
    if (disposition === 'OUTBOUND') {
        callType = 'Outbound Call';
    } else if (disposition === 'ANSWERED' && billsec > 0) {
        callType = 'Answered Call';
    }

    const dateStr = formatDate(callTime);
    const startStr = formatTime(callTime);
    const endStr = endTime ? formatTime(endTime) : 'N/A';
    const commentText = `${callType} from ${finalName} on ${dateStr} | Start: ${startStr} | End: ${endStr} | Duration: ${duration}s | Billsec: ${billsec}s`;

    // Existing contact — add comment to latest booking & bump lastInteractionAt to callTime so entry moves to TOP
    if (contact) {
        const latestBooking = await Booking.findOne({ primaryContactId: contact._id }).sort({ createdAt: -1 });
        if (latestBooking) {
            await Comment.create({
                bookingId: latestBooking._id,
                userId: phoneLeadUser._id,
                text: commentText,
                createdAt: callTime || new Date(),
            });

            if (latestBooking.assignedToUserId) {
                await Notification.create({
                    userId: latestBooking.assignedToUserId,
                    bookingId: latestBooking._id,
                    message: `Missed call from ${finalName} (${contact.contactPhoneNo}) on your lead ${latestBooking.uniqueCode}.`,
                });
            }

            // ponytail: bump lastInteractionAt only if incoming callTime is newer than existing lastInteractionAt
            const incomingTime = callTime || new Date();
            if (!latestBooking.lastInteractionAt || new Date(incomingTime).getTime() > new Date(latestBooking.lastInteractionAt).getTime()) {
                latestBooking.lastInteractionAt = incomingTime;
                await latestBooking.save();
            }

            CacheInvalidation.onBookingWrite(latestBooking._id.toString());
            return { action: 'comment_added', contactId: contact._id, bookingId: latestBooking._id };
        }
    }

    let existingBooking = await Booking.findOne({ pbxCallId });
    if (existingBooking) {
        let updated = false;
        if (disposition === 'ANSWERED' && billsec > 0 && (existingBooking as any).callDisposition !== 'ANSWERED') {
            (existingBooking as any).callDisposition = 'ANSWERED';
            updated = true;
        }
        if (contact && contact.requirements && contact.requirements.includes('Call from')) {
            contact.requirements = commentText;
            updated = true;
            await contact.save();
        }
        const incomingTime = callTime || new Date();
        if (!existingBooking.lastInteractionAt || new Date(incomingTime).getTime() > new Date(existingBooking.lastInteractionAt).getTime()) {
            existingBooking.lastInteractionAt = incomingTime;
            await existingBooking.save();
        } else if (updated) {
            await existingBooking.save();
        }
        CacheInvalidation.onBookingWrite(existingBooking._id.toString());
        return { action: updated ? 'lead_updated' : 'lead_exists_no_update', contactId: contact?._id, bookingId: existingBooking._id };
    }

    if (!contact) {
        contact = await PrimaryContact.create({
            contactName: finalName,
            contactPhoneNo: callerNumber,
            bookingType: 'Direct (B2C)',
            requirements: commentText,
        });
    }

    const booking: any = await (Booking as any).create({
        primaryContactId: (contact as any)._id,
        contact: {
            name: (contact as any).contactName,
            phone: (contact as any).contactPhoneNo,
            type: (contact as any).bookingType,
            requirements: commentText,
            interested: false,
        },
        createdByUserId: phoneLeadUser._id,
        status: 'Pending',
        segments: [],
        callDisposition: disposition === 'OUTBOUND' ? 'OUTBOUND' : (disposition === 'ANSWERED' && billsec > 0 ? 'ANSWERED' : 'MISSED'),
        pbxCallId: pbxCallId,
        lastInteractionAt: callTime || new Date()
    });

    // Anything the GDMS payload carries beyond name/phone (call time, duration, disposition)
    // has no dedicated booking field, so it's recorded as a comment on the new lead.
    await Comment.create({
        bookingId: booking._id,
        userId: phoneLeadUser._id,
        text: commentText,
        createdAt: callTime || new Date(),
    });

    CacheInvalidation.onBookingWrite(booking._id.toString());
    return { action: 'lead_created', contactId: (contact as any)._id, bookingId: booking._id };
};

export const receiveMissedCall = asyncHandler(async (req: Request, res: Response) => {
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
        let disposition = (cdr.disposition || '').toUpperCase();
        const billsec = parseInt(cdr.billsec || '0', 10);
        const uniqueId = cdr.uniqueid || cdr.uniqueId;
        if (!uniqueId) {
            skippedCount++;
            continue;
        }

        let finalCallerNumber = (cdr.src || '').toString();
        let finalCallerName = cdr.caller_name || cdr.src || '';
        let finalDisposition = (cdr.disposition || '').toUpperCase();

        if (cdr.userfield === 'Outbound') {
            console.log(`[GDMS Webhook] Processing outbound call to ${cdr.dst}`);
            finalCallerNumber = (cdr.dst || '').toString();
            finalCallerName = 'Outbound Customer';
            finalDisposition = 'OUTBOUND';
        } else {
            if (finalCallerNumber.length <= 4 && finalCallerNumber.length > 0) {
                console.log(`[GDMS Webhook] Skipping internal extension call: ${finalCallerNumber}`);
                skippedCount++;
                continue;
            }
        }

        const callerNumber = finalCallerNumber;
        const callerName = finalCallerName;
        disposition = finalDisposition;
        const callTime = cdr.start ? new Date(cdr.start) : new Date();
        const endTime = cdr.end ? new Date(cdr.end) : null;
        const duration = parseInt(cdr.duration || '0', 10);

        if (!callerNumber) {
            skippedCount++;
            continue;
        }

        try {
            const result = await processCallIntoCRM(callerNumber, callerName, callTime, endTime, duration, billsec, disposition, uniqueId);
            console.log(`[GDMS Webhook] ${result.action} for ${callerNumber} (${disposition})`);

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
