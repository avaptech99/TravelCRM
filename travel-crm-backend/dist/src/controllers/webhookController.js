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
const cache_1 = require("../utils/cache");
const background_1 = require("../utils/background");
const sseManager_1 = require("../sse/sseManager");
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// ponytail: Helper for Phone Lead system user
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
const CRM_TIMEZONE = 'America/Toronto';
// Format a real UTC instant for display in Toronto time. Native Intl, no
// dependency on the server process's own local timezone.
const torontoParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: CRM_TIMEZONE,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
};
const formatDate = (date) => {
    const p = torontoParts(date);
    return `${p.day}/${p.month}/${p.year}`;
};
const formatTime = (date) => {
    const p = torontoParts(date);
    return `${p.hour}:${p.minute}`;
};
// The PBX (GDMS/UCM) is configured for America/Toronto and sends CDR
// timestamps as bare strings with no timezone marker (e.g.
// "2026-09-10 05:11:10") -- that string IS Toronto wall-clock time. Parsing
// it with plain `new Date(str)` doesn't know that; it's interpreted using
// whatever timezone the running Node process itself considers "local"
// (Render, not configured for Toronto), so the resulting Date silently
// represented the wrong UTC instant -- off by the full 4-5h DST-dependent
// offset, baked into `createdAt`/`lastInteractionAt` at write time, not just
// a display bug. Parse the components explicitly as Toronto wall-clock time
// and convert to the correct UTC instant, independent of server config.
const TORONTO_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;
function parsePbxTimestamp(pbxStr) {
    if (!pbxStr)
        return null;
    const m = pbxStr.match(TORONTO_DATETIME_RE);
    if (!m) {
        // Not the bare "YYYY-MM-DD HH:mm:ss" shape GDMS sends -- fall back to
        // normal parsing (e.g. an already-tagged ISO string with an offset/Z).
        const fallback = new Date(pbxStr);
        return isNaN(fallback.getTime()) ? null : fallback;
    }
    const [, yStr, moStr, dStr, hStr, miStr, sStr] = m;
    const y = parseInt(yStr, 10), mo = parseInt(moStr, 10), d = parseInt(dStr, 10);
    const h = parseInt(hStr, 10), mi = parseInt(miStr, 10), s = parseInt(sStr, 10);
    // Toronto is UTC-4 (EDT) or UTC-5 (EST) depending on DST -- try both and
    // keep whichever one, formatted back through the IANA zone, reproduces
    // the exact wall-clock time the PBX reported (correctly handles the
    // DST transition dates themselves too).
    for (const offsetHours of [4, 5]) {
        const guess = new Date(Date.UTC(y, mo - 1, d, h + offsetHours, mi, s));
        const p = torontoParts(guess);
        if (parseInt(p.year) === y && parseInt(p.month) === mo && parseInt(p.day) === d && parseInt(p.hour) === h && parseInt(p.minute) === mi) {
            return guess;
        }
    }
    return new Date(Date.UTC(y, mo - 1, d, h + 4, mi, s)); // fallback: assume EDT
}
// A UCM ring group (action_type "RINGGROUP[...]") fans one call out to every
// member extension. Only the extension that actually answers should count;
// every other extension gets its own NO ANSWER leg with its own webhook call,
// but UCM already tells us the call was picked up elsewhere via `reason` --
// no need to buffer/wait for a sibling ANSWERED event, this leg alone is
// enough to know it must not be logged as missed.
const wasAnsweredOnAnotherExtension = (cdr) => {
    const actionType = String(cdr.action_type || '');
    const reason = String(cdr.reason || '').toLowerCase();
    return /^ringgroup/i.test(actionType) && reason.includes('answered elsewhere');
};
const processCallIntoCRM = async (callerNumber, callerName, callTime, endTime, duration, billsec, disposition, pbxCallId, answeredExtension) => {
    const phoneLeadUser = await getPhoneLeadUser();
    const normalizedNumber = callerNumber.replace(/[\s\-\(\)\+]/g, '');
    let contact = await PrimaryContact_1.default.findOne({
        contactPhoneNo: { $regex: new RegExp(normalizedNumber + '$') },
    });
    let finalName = 'Unknown';
    if (contact && contact.contactName) {
        finalName = contact.contactName;
    }
    else if (callerName && callerName !== callerNumber) {
        finalName = callerName;
    }
    // Only a missed call should bump lastInteractionAt / move the lead to the top
    const isMissedCall = disposition !== 'OUTBOUND' && !(disposition === 'ANSWERED' && billsec > 0);
    let callType = 'Missed Call';
    if (disposition === 'OUTBOUND') {
        callType = 'Outbound Call';
    }
    else if (disposition === 'ANSWERED' && billsec > 0) {
        callType = 'Answered Call';
    }
    const dateStr = formatDate(callTime);
    const startStr = formatTime(callTime);
    const endStr = endTime ? formatTime(endTime) : 'N/A';
    const answeredBySuffix = callType === 'Answered Call' && answeredExtension ? ` | Answered by ext. ${answeredExtension}` : '';
    const commentText = `${callType} from ${finalName} on ${dateStr} | Start: ${startStr} | End: ${endStr} | Duration: ${duration}s | Billsec: ${billsec}s${answeredBySuffix}`;
    // Existing contact — add comment to latest booking & bump lastInteractionAt to callTime so entry moves to TOP
    if (contact) {
        const latestBooking = await Booking_1.default.findOne({ primaryContactId: contact._id }).sort({ createdAt: -1 });
        if (latestBooking) {
            // A genuinely-missed ring group call (no extension answers) still
            // fires one webhook leg per rung extension -- without this, each
            // leg would log its own "Missed Call from ..." comment for what is
            // really one physical call. Treat legs within a few seconds of an
            // already-logged missed call on this lead as the same call.
            if (callType === 'Missed Call') {
                const RING_GROUP_WINDOW_MS = 20000;
                const incoming = callTime || new Date();
                const alreadyLogged = await Comment_1.default.findOne({
                    bookingId: latestBooking._id,
                    text: { $regex: '^Missed Call from' },
                    createdAt: {
                        $gte: new Date(incoming.getTime() - RING_GROUP_WINDOW_MS),
                        $lte: new Date(incoming.getTime() + RING_GROUP_WINDOW_MS),
                    },
                }).lean();
                if (alreadyLogged) {
                    return { action: 'duplicate_ring_group_leg', contactId: contact._id, bookingId: latestBooking._id };
                }
            }
            await Comment_1.default.create({
                bookingId: latestBooking._id,
                userId: phoneLeadUser._id,
                text: commentText,
                createdAt: callTime || new Date(),
            });
            if (latestBooking.assignedToUserId) {
                await Notification_1.default.create({
                    userId: latestBooking.assignedToUserId,
                    bookingId: latestBooking._id,
                    message: `Missed call from ${finalName} (${contact.contactPhoneNo}) on your lead ${latestBooking.uniqueCode}.`,
                });
            }
            // Only a missed call moves the lead to the top; answered/outbound calls just log a comment
            if (isMissedCall) {
                const incomingTime = callTime || new Date();
                let dirty = false;
                if (!latestBooking.lastInteractionAt || new Date(incomingTime).getTime() > new Date(latestBooking.lastInteractionAt).getTime()) {
                    latestBooking.lastInteractionAt = incomingTime;
                    dirty = true;
                }
                // A new missed call means the lead needs attention again -- reset it
                // back to the front of the queue. Only 'Working' is defined as
                // resettable; 'Booked'/'Sent'/'Follow Up' are left alone since they
                // represent a deliberate later-stage decision, not "not yet handled".
                if (latestBooking.status === 'Working') {
                    latestBooking.status = 'Pending';
                    dirty = true;
                }
                if (dirty) {
                    await latestBooking.save();
                }
            }
            cache_1.CacheInvalidation.onBookingWrite(latestBooking._id.toString());
            // ✅ Notify agents watching this lead live -- GDMS writes went
            // straight to the DB with no SSE push, so a connected agent never
            // saw the new comment/status reset until they manually refreshed.
            (0, sseManager_1.pushBookingEvent)('comment_added', {
                bookingId: latestBooking._id.toString(),
                assignedToUserId: String(latestBooking.assignedToUserId || ''),
                assignedGroup: latestBooking.assignedGroup || '',
                createdByUserId: String(latestBooking.createdByUserId || ''),
            });
            return { action: 'comment_added', contactId: contact._id, bookingId: latestBooking._id };
        }
    }
    let existingBooking = await Booking_1.default.findOne({ pbxCallId });
    if (existingBooking) {
        let updated = false;
        if (disposition === 'ANSWERED' && billsec > 0 && existingBooking.callDisposition !== 'ANSWERED') {
            existingBooking.callDisposition = 'ANSWERED';
            updated = true;
        }
        if (contact && contact.requirements && contact.requirements.includes('Call from')) {
            contact.requirements = commentText;
            updated = true;
            await contact.save();
        }
        const incomingTime = callTime || new Date();
        if (isMissedCall && (!existingBooking.lastInteractionAt || new Date(incomingTime).getTime() > new Date(existingBooking.lastInteractionAt).getTime())) {
            existingBooking.lastInteractionAt = incomingTime;
            await existingBooking.save();
        }
        else if (updated) {
            await existingBooking.save();
        }
        cache_1.CacheInvalidation.onBookingWrite(existingBooking._id.toString());
        if (updated) {
            (0, sseManager_1.pushBookingEvent)('booking_updated', {
                bookingId: existingBooking._id.toString(),
                assignedToUserId: String(existingBooking.assignedToUserId || ''),
                assignedGroup: existingBooking.assignedGroup || '',
                createdByUserId: String(existingBooking.createdByUserId || ''),
                changes: { callDisposition: existingBooking.callDisposition, lastInteractionAt: existingBooking.lastInteractionAt },
            });
        }
        return { action: updated ? 'lead_updated' : 'lead_exists_no_update', contactId: contact?._id, bookingId: existingBooking._id };
    }
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
        contact: {
            name: contact.contactName,
            phone: contact.contactPhoneNo,
            type: contact.bookingType,
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
    await Comment_1.default.create({
        bookingId: booking._id,
        userId: phoneLeadUser._id,
        text: commentText,
        createdAt: callTime || new Date(),
    });
    cache_1.CacheInvalidation.onBookingWrite(booking._id.toString());
    // ✅ New lead from GDMS -- refresh Overview/All Leads lists live, same as
    // a manually-created booking already does.
    (0, sseManager_1.pushBookingEvent)('booking_created', {
        bookingId: booking._id.toString(),
        status: booking.status,
        assignedToUserId: '',
        assignedGroup: '',
        createdByUserId: String(booking.createdByUserId || ''),
    });
    return { action: 'lead_created', contactId: contact._id, bookingId: booking._id };
};
// How long to wait, once a ForkCDR placeholder leg arrives, to see whether a
// sibling ring-group leg (same base uniqueid) shows up before deciding this
// leg's NO ANSWER is the real, final outcome. Real payloads showed every
// ring-group leg of a call arriving within ~1s of each other, so this is
// generous margin, not a guess at UCM's ring timeout.
const FORK_CDR_WAIT_MS = 6000;
const finalizeLeg = async (legKey, uniqueId, callerNumber, callerName, callTime, endTime, duration, billsec, disposition, dst, rawCdr) => {
    const result = await processCallIntoCRM(callerNumber, callerName, callTime, endTime, duration, billsec, disposition, uniqueId, dst);
    console.log(`[GDMS Webhook] ${result.action} for ${callerNumber} (${disposition})`);
    await MissedCall_1.default.findOneAndUpdate({ uniqueId: legKey }, {
        callerNumber,
        callerName,
        calledNumber: dst || '',
        callTime,
        endTime,
        duration,
        billsec,
        disposition: rawCdr.disposition || 'UNKNOWN',
        uniqueId: legKey,
        channel: rawCdr.channel || '',
        userfield: rawCdr.userfield || '',
        rawPayload: rawCdr, // still carries the true call-level uniqueid
        isProcessed: true,
    }, { upsert: true, new: true });
};
exports.receiveMissedCall = (0, express_async_handler_1.default)(async (req, res) => {
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
        let disposition = (cdr.disposition || '').toUpperCase();
        const billsec = parseInt(cdr.billsec || '0', 10);
        const uniqueId = cdr.uniqueid || cdr.uniqueId;
        if (!uniqueId) {
            skippedCount++;
            continue;
        }
        // `uniqueid` identifies the whole call, NOT one webhook leg -- real
        // production payloads confirmed every leg of a single call (the
        // initial DID leg, plus every ring-group extension's own leg) shares
        // the exact same uniqueid. Deduping on uniqueid alone meant the
        // FIRST leg received (typically the DID leg, which reports NO ANSWER
        // immediately, before the ring group has even started ringing) got
        // logged and marked processed -- and every subsequent leg, including
        // the one that would show the call was genuinely ANSWERED, was
        // silently skipped as "already processed". Dedup on uniqueid + the
        // leg's own destination (dst) instead -- still catches a true GDMS
        // retry of the same leg, no longer conflates different legs of the
        // same call. (Reuses the existing MissedCall.uniqueId column/unique
        // index as-is -- no schema change, just a more specific key value.)
        const legKey = `${uniqueId}_${cdr.dst || 'unknown'}`;
        const alreadyProcessed = await MissedCall_1.default.findOne({ uniqueId: legKey, isProcessed: true }).lean();
        if (alreadyProcessed) {
            console.log(`[GDMS Webhook] Skipping already-processed CDR leg ${legKey}`);
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
        }
        else {
            if (finalCallerNumber.length <= 4 && finalCallerNumber.length > 0) {
                console.log(`[GDMS Webhook] Skipping internal extension call: ${finalCallerNumber}`);
                skippedCount++;
                continue;
            }
        }
        const callerNumber = finalCallerNumber;
        const callerName = finalCallerName;
        disposition = finalDisposition;
        const callTime = parsePbxTimestamp(cdr.start) || new Date();
        const endTime = parsePbxTimestamp(cdr.end);
        const duration = parseInt(cdr.duration || '0', 10);
        if (!callerNumber) {
            skippedCount++;
            continue;
        }
        // Asterisk's ForkCDR() application splits off a synthetic tracking
        // CDR the instant a call enters DID routing. Two genuinely different
        // situations produce the EXACT same signature (dcontext "ext-did-1",
        // action_type "DIAL", lastapp "ForkCDR", NO ANSWER, zero duration):
        // (1) this DID still uses old-style single-leg routing, and this IS
        //     the whole call -- its NO ANSWER is the real, final outcome.
        // (2) this DID now fans into a ring group, and this is just a
        //     placeholder fired before any extension has even started
        //     ringing -- real ring-group legs with the SAME uniqueid are
        //     about to follow, and THEY carry the true outcome.
        // Can't tell which one this is synchronously -- wait briefly for a
        // sibling ring-group leg before deciding, per the ring-group brief's
        // buffered-write approach.
        if (String(cdr.lastapp || '').toLowerCase() === 'forkcdr') {
            await MissedCall_1.default.findOneAndUpdate({ uniqueId: legKey }, {
                callerNumber, callerName, calledNumber: cdr.dst || '', callTime, endTime,
                duration, billsec, disposition: cdr.disposition || 'UNKNOWN', uniqueId: legKey,
                channel: cdr.channel || '', userfield: cdr.userfield || '', rawPayload: cdr,
                isProcessed: false,
            }, { upsert: true });
            const capturedCdr = cdr;
            setTimeout(() => {
                (0, background_1.runBG)(`forkCdrResolve_${legKey}`, async () => {
                    const sibling = await MissedCall_1.default.findOne({
                        uniqueId: { $regex: new RegExp(`^${escapeRegExp(uniqueId)}_`), $ne: legKey },
                    }).lean();
                    if (sibling) {
                        console.log(`[GDMS Webhook] ForkCDR leg ${legKey} confirmed a routing placeholder -- ring-group sibling handled the real outcome`);
                        await MissedCall_1.default.updateOne({ uniqueId: legKey }, { isProcessed: true });
                        return;
                    }
                    console.log(`[GDMS Webhook] ForkCDR leg ${legKey} has no ring-group sibling after ${FORK_CDR_WAIT_MS}ms -- old-style single-leg DID, logging as missed`);
                    await finalizeLeg(legKey, uniqueId, callerNumber, callerName, callTime, endTime, duration, billsec, disposition, capturedCdr.dst, capturedCdr);
                });
            }, FORK_CDR_WAIT_MS);
            skippedCount++; // not synchronously integrated -- resolved in the background above
            continue;
        }
        // This extension's leg didn't answer, but a sibling extension in the
        // same ring group did -- the call was handled, not missed. The
        // sibling's own leg (disposition ANSWERED) is what logs the real
        // interaction; this leg must not create a false "missed call".
        if (disposition !== 'OUTBOUND' && wasAnsweredOnAnotherExtension(cdr)) {
            console.log(`[GDMS Webhook] Skipping ${callerNumber} leg on ${cdr.dst} -- answered on another ring group extension`);
            skippedCount++;
            continue;
        }
        try {
            await finalizeLeg(legKey, uniqueId, callerNumber, callerName, callTime, endTime, duration, billsec, disposition, cdr.dst, cdr);
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
