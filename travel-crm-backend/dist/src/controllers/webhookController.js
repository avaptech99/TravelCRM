"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveMissedCall = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const PrimaryContact_1 = __importDefault(require("../models/PrimaryContact"));
const User_1 = __importDefault(require("../models/User"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Notification_1 = __importDefault(require("../models/Notification"));
const MissedCall_1 = __importDefault(require("../models/MissedCall"));
const cache_1 = __importDefault(require("../utils/cache"));
// Helper: Find or create a system user named "Phone Lead"
const getPhoneLeadUser = async () => {
    let user = await User_1.default.findOne({ email: 'phone-lead@system.internal' });
    if (!user) {
        user = await User_1.default.create({
            name: 'Phone Lead',
            email: 'phone-lead@system.internal',
            passwordHash: 'PHONE_LEAD_SYSTEM_NO_LOGIN',
            role: 'AGENT',
        });
    }
    return user;
};
// Helper: Format date only — "4/4/2026"
const formatDate = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};
// Helper: Format time only — "14:15"
const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
// Core: Process a single call into the CRM
const processCallIntoCRM = async (callerNumber, callerName, callTime, endTime, duration, billsec, disposition, pbxCallId) => {
    const phoneLeadUser = await getPhoneLeadUser();
    // Normalize number for lookup (strip spaces, dashes, + etc.)
    const normalizedNumber = callerNumber.replace(/[\s\-\(\)\+]/g, '');
    // Check CRM for existing contact
    let contact = await PrimaryContact_1.default.findOne({
        contactPhoneNo: { $regex: new RegExp(normalizedNumber + '$') },
    });
    // Determine name: Prioritize CRM name > caller name from PBX > "Unknown"
    let finalName = 'Unknown';
    if (contact && contact.contactName) {
        finalName = contact.contactName;
    }
    else if (callerName && callerName !== callerNumber) {
        finalName = callerName;
    }
    // Build call type label
    let callType = 'Missed Call';
    if (disposition === 'OUTBOUND') {
        callType = 'Outbound Call';
    }
    else if (disposition === 'ANSWERED' && billsec > 0) {
        callType = 'Answered Call';
    }
    // Format times
    const dateStr = formatDate(callTime);
    const startStr = formatTime(callTime);
    const endStr = endTime ? formatTime(endTime) : 'N/A';
    // Build detailed comment text
    const commentText = `${callType} from ${finalName} on ${dateStr} | Start: ${startStr} | End: ${endStr} | Duration: ${duration}s | Billsec: ${billsec}s`;
    // Existing contact — add comment to latest booking + notify agent
    if (contact) {
        const latestBooking = await Booking_1.default.findOne({ primaryContactId: contact._id }).sort({ createdAt: -1 });
        if (latestBooking) {
            await Comment_1.default.create({
                bookingId: latestBooking._id,
                createdById: phoneLeadUser._id,
                text: commentText,
            });
            // Notify assigned agent
            if (latestBooking.assignedToUserId) {
                await Notification_1.default.create({
                    userId: latestBooking.assignedToUserId,
                    bookingId: latestBooking._id,
                    message: `Missed call from ${finalName} (${contact.contactPhoneNo}) on your lead ${latestBooking.uniqueCode}.`,
                });
                cache_1.default.invalidateByPrefix(`notifications_${latestBooking.assignedToUserId}`);
            }
            // Also update the booking's lastInteractionAt to jump to top
            latestBooking.lastInteractionAt = new Date();
            await latestBooking.save();
            cache_1.default.invalidateByPrefix('bookings_');
            return { action: 'comment_added', contactId: contact._id, bookingId: latestBooking._id };
        }
    }
    // Check if a booking already exists for this PBX Call Unique ID
    let existingBooking = await Booking_1.default.findOne({ pbxCallId });
    if (existingBooking) {
        let updated = false;
        // If the new record is ANSWERED and previous was MISSED, update it
        if (disposition === 'ANSWERED' && billsec > 0 && existingBooking.callDisposition !== 'ANSWERED') {
            existingBooking.callDisposition = 'ANSWERED';
            updated = true;
        }
        // Always update requirements/comment if we have a better/longer duration
        // We'll update the contact requirements if it was a system-generated one
        if (contact && contact.requirements && contact.requirements.includes('Call from')) {
            contact.requirements = commentText;
            updated = true;
            await contact.save();
        }
        if (updated) {
            existingBooking.lastInteractionAt = new Date();
            await existingBooking.save();
            cache_1.default.invalidateByPrefix('bookings_');
            return { action: 'lead_updated', contactId: contact?._id, bookingId: existingBooking._id };
        }
        // Even if no visual update, refresh interaction time to jump to top
        existingBooking.lastInteractionAt = new Date();
        await existingBooking.save();
        return { action: 'lead_exists_no_update', contactId: contact?._id, bookingId: existingBooking._id };
    }
    // New contact — create lead
    if (!contact) {
        contact = await PrimaryContact_1.default.create({
            contactName: finalName,
            contactPhoneNo: callerNumber,
            bookingType: 'Direct (B2C)',
            requirements: commentText,
        });
    }
    const booking = await Booking_1.default.create({
        primaryContactId: contact._id,
        createdByUserId: phoneLeadUser._id,
        status: 'Pending',
        destination: null,
        flightFrom: null,
        flightTo: null,
        segments: [],
        callDisposition: disposition === 'OUTBOUND' ? 'OUTBOUND' : (disposition === 'ANSWERED' && billsec > 0 ? 'ANSWERED' : 'MISSED'),
        pbxCallId: pbxCallId,
        lastInteractionAt: new Date()
    });
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('stats_');
    cache_1.default.invalidateByPrefix('recent_');
    return { action: 'lead_created', contactId: contact._id, bookingId: booking._id };
};
// @desc    Receive CDR webhook from GDMS/UCM
// @route   POST /api/webhook/missed-call
// @access  Protected by HTTP Basic Auth
exports.receiveMissedCall = (0, express_async_handler_1.default)(async (req, res) => {
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
    let cdrRoot = [];
    if (req.body.cdr_root && Array.isArray(req.body.cdr_root)) {
        cdrRoot = req.body.cdr_root;
    }
    else if (Array.isArray(req.body)) {
        cdrRoot = req.body;
    }
    else if (req.body.src || req.body.uniqueid) {
        cdrRoot = [req.body];
    }
    else {
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
        let disposition = (cdr.disposition || '').toUpperCase();
        const billsec = parseInt(cdr.billsec || '0', 10);
        const uniqueId = cdr.uniqueid || cdr.uniqueId;
        if (!uniqueId) {
            skippedCount++;
            continue;
        }
        // Handing Outbound calls: Swap src/dst so the customer is the primary contact
        let finalCallerNumber = (cdr.src || '').toString();
        let finalCallerName = cdr.caller_name || cdr.src || '';
        let finalDisposition = (cdr.disposition || '').toUpperCase();
        if (cdr.userfield === 'Outbound') {
            console.log(`[GDMS Webhook] Processing outbound call to ${cdr.dst}`);
            finalCallerNumber = (cdr.dst || '').toString();
            finalCallerName = 'Outbound Customer';
            finalDisposition = 'OUTBOUND';
        }
        else {
            // Filtering for Inbound: Ignore internal extensions (4 digits or fewer)
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
            // 1. Process into CRM (add comment or create lead)
            const result = await processCallIntoCRM(callerNumber, callerName, callTime, endTime, duration, billsec, disposition, uniqueId);
            console.log(`[GDMS Webhook] ${result.action} for ${callerNumber} (${disposition})`);
            // 2. Save/update MissedCall log and mark as processed
            await MissedCall_1.default.findOneAndUpdate({ uniqueId }, {
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
            }, { upsert: true, new: true });
            processedCount++;
        }
        catch (err) {
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
