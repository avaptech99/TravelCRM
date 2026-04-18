import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import MissedCall from '../models/MissedCall';

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
        // Format 1: { cdr_root: [ {...}, {...} ] }
        cdrRoot = req.body.cdr_root;
    } else if (Array.isArray(req.body)) {
        // Format 2: [ {...}, {...} ]
        cdrRoot = req.body;
    } else if (req.body.src || req.body.uniqueid) {
        // Format 3: Single CDR object { src: "...", dst: "...", ... }
        cdrRoot = [req.body];
    } else {
        // Format 4: Try to find any array inside the payload
        const arrayKey = Object.keys(req.body).find(key => Array.isArray(req.body[key]));
        if (arrayKey) {
            cdrRoot = req.body[arrayKey];
            console.log(`[GDMS Webhook] Found CDR data under key: "${arrayKey}"`);
        }
    }

    if (cdrRoot.length === 0) {
        // Still save the raw payload for debugging even if we can't parse it
        console.error('[GDMS Webhook] Could not parse CDR data. Raw body keys:', Object.keys(req.body));
        console.error('[GDMS Webhook] Raw body:', JSON.stringify(req.body));
        res.status(200).json({
            success: true,
            message: 'Payload received but no CDR records found. Raw payload logged for debugging.',
            rawKeys: Object.keys(req.body),
        });
        return;
    }

    let savedCount = 0;
    let skippedCount = 0;

    for (const cdr of cdrRoot) {
        // Filter: Only store missed calls (not answered)
        const disposition = (cdr.disposition || '').toUpperCase();
        const billsec = parseInt(cdr.billsec || '0', 10);

        if (disposition === 'ANSWERED' && billsec > 0) {
            skippedCount++;
            continue;
        }

        const uniqueId = cdr.uniqueid || cdr.uniqueId;
        if (!uniqueId) {
            skippedCount++;
            continue;
        }

        // Parse dates from GDMS format (e.g. "2019-11-27 07:17:08")
        const callTime = cdr.start ? new Date(cdr.start) : new Date();
        const endTime = cdr.end ? new Date(cdr.end) : null;

        try {
            await MissedCall.findOneAndUpdate(
                { uniqueId },
                {
                    callerNumber: cdr.src || '',
                    callerName: cdr.caller_name || cdr.src || '',
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
                },
                { upsert: true, new: true }
            );
            savedCount++;
        } catch (err: any) {
            // Duplicate key errors are fine (deduplication working)
            if (err.code === 11000) {
                skippedCount++;
            } else {
                console.error(`[GDMS Webhook] Error saving CDR ${uniqueId}:`, err.message);
            }
        }
    }

    console.log(`[GDMS Webhook] Processed ${cdrRoot.length} CDRs: ${savedCount} saved, ${skippedCount} skipped`);

    res.status(200).json({
        success: true,
        message: `Processed ${cdrRoot.length} CDR records`,
        saved: savedCount,
        skipped: skippedCount,
    });
});

// @desc    Get all missed calls (paginated)
// @route   GET /api/webhook/missed-calls
// @access  Protected (JWT)
export const getMissedCalls = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (search) {
        filter.$or = [
            { callerNumber: { $regex: search, $options: 'i' } },
            { callerName: { $regex: search, $options: 'i' } },
            { calledNumber: { $regex: search, $options: 'i' } },
        ];
    }

    const total = await MissedCall.countDocuments(filter);
    const missedCalls = await MissedCall.find(filter)
        .sort({ callTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    res.json({
        missedCalls,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});

// @desc    Toggle reviewed status
// @route   PATCH /api/webhook/missed-calls/:id/review
// @access  Protected (JWT)
export const toggleReviewed = asyncHandler(async (req: Request, res: Response) => {
    const call = await MissedCall.findById(req.params.id);

    if (!call) {
        res.status(404);
        throw new Error('Missed call not found');
    }

    call.isReviewed = !call.isReviewed;
    await call.save();

    res.json({ success: true, isReviewed: call.isReviewed });
});
