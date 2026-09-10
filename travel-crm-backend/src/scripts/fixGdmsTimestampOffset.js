/**
 * Corrects the STORED UTC instant for GDMS-derived timestamps that were
 * mis-parsed at ingestion time. Root cause: the PBX (GDMS/UCM) is configured
 * for America/Toronto and sends CDR start/end as bare strings with no
 * timezone marker (e.g. "2026-09-10 05:11:10") -- that string IS Toronto
 * wall-clock time. The old webhook code parsed it with plain `new Date(str)`,
 * which is interpreted using the server process's own local timezone
 * (Render, not Toronto) -- so the resulting Date represented the wrong UTC
 * instant from the moment it was written, off by the full 4-5h DST-dependent
 * offset. The webhook itself is already fixed (parsePbxTimestamp in
 * webhookController.ts) -- this only corrects values already in the DB.
 *
 * This is DIFFERENT from fixGdmsCommentTimestamps.js (which only rewrites
 * comment TEXT from an already-correct createdAt). This script corrects the
 * actual createdAt/callTime/endTime fields themselves.
 *
 * Fixes:
 *   comments.createdAt    -- for comments authored by the Phone Lead system
 *                             user matching the GDMS call-log text pattern
 *   missedcalls.callTime  -- for every MissedCall audit record
 *   missedcalls.endTime
 *
 * Does NOT touch bookings.createdAt (Mongoose's own timestamps:true sets
 * that from real wall-clock time when the document was inserted, not parsed
 * from the PBX string -- never affected by this bug).
 *
 * bookings.lastInteractionAt is NOT corrected by this script either -- run
 * recalcMissedCallLastInteraction.js afterward to recompute it from the
 * now-corrected comment timestamps.
 *
 * After running this with --confirm, also re-run (in order):
 *   1. node src/scripts/fixGdmsCommentTimestamps.js "<URI>" --confirm
 *      (rebuilds comment TEXT's Start/End/date from the corrected createdAt)
 *   2. node src/scripts/recalcMissedCallLastInteraction.js "<URI>" --confirm
 *      (recomputes bookings.lastInteractionAt from the corrected comments)
 *
 * Dry run (default, updates nothing, just reports how many rows would change):
 *   cd travel-crm-backend
 *   node src/scripts/fixGdmsTimestampOffset.js "<MONGODB_URI>"
 *
 * Apply:
 *   node src/scripts/fixGdmsTimestampOffset.js "<MONGODB_URI>" --confirm
 */

const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');
const uri = args.find(a => !a.startsWith('--')) || process.env.MONGODB_URI;

if (!uri) {
    console.error('No MongoDB URI given. Pass it as an argument or set MONGODB_URI in .env.');
    process.exit(1);
}

const CRM_TIMEZONE = 'America/Toronto';

function torontoParts(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: CRM_TIMEZONE,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

// The currently-stored (wrong) Date was built by treating the PBX's naive
// Toronto-local string as if it were UTC -- so its OWN UTC-component
// readout is literally the original PBX string's digits. Feed those back
// through the same Toronto-wall-time-to-UTC conversion the fixed webhook
// code uses to get the true UTC instant.
function correctWronglyStoredDate(wrongDate) {
    const y = wrongDate.getUTCFullYear(), mo = wrongDate.getUTCMonth() + 1, d = wrongDate.getUTCDate();
    const h = wrongDate.getUTCHours(), mi = wrongDate.getUTCMinutes(), s = wrongDate.getUTCSeconds();
    for (const offsetHours of [4, 5]) {
        const guess = new Date(Date.UTC(y, mo - 1, d, h + offsetHours, mi, s));
        const p = torontoParts(guess);
        if (p.year === y && p.month === mo && p.day === d && p.hour === h && p.minute === mi) {
            return guess;
        }
    }
    return new Date(Date.UTC(y, mo - 1, d, h + 4, mi, s)); // fallback: assume EDT
}

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`\n--- Correcting GDMS timestamp offset: ${db.databaseName} ---`);

    // Scope strictly to the Phone Lead system user's GDMS call-log comments --
    // never touch a human-authored comment.
    const phoneLeadUser = await db.collection('users').findOne({ email: 'phone-lead@system.internal' }, { projection: { _id: 1 } });
    if (!phoneLeadUser) {
        console.log('No Phone Lead system user found -- nothing to correct.');
        await mongoose.disconnect();
        return;
    }

    const comments = await db.collection('comments')
        .find({
            userId: phoneLeadUser._id,
            text: { $regex: '^(Missed Call|Answered Call|Outbound Call) from .+ \\| Start: ' },
        })
        .project({ createdAt: 1 })
        .toArray();
    console.log(`Found ${comments.length} GDMS call-log comments.`);

    const commentOps = comments.map(c => {
        const corrected = correctWronglyStoredDate(new Date(c.createdAt));
        return { _id: c._id, from: c.createdAt, to: corrected };
    }).filter(x => new Date(x.from).getTime() !== x.to.getTime());

    console.log(`Comments needing correction: ${commentOps.length}`);
    if (commentOps.length > 0) {
        console.log('Sample:');
        for (const op of commentOps.slice(0, 3)) {
            console.log(`  ${op._id}: ${new Date(op.from).toISOString()} -> ${op.to.toISOString()}`);
        }
    }

    const missedCalls = await db.collection('missedcalls')
        .find({})
        .project({ callTime: 1, endTime: 1 })
        .toArray();
    console.log(`\nFound ${missedCalls.length} MissedCall audit records.`);

    const missedCallOps = [];
    for (const mc of missedCalls) {
        const set = {};
        if (mc.callTime) {
            const corrected = correctWronglyStoredDate(new Date(mc.callTime));
            if (new Date(mc.callTime).getTime() !== corrected.getTime()) set.callTime = corrected;
        }
        if (mc.endTime) {
            const corrected = correctWronglyStoredDate(new Date(mc.endTime));
            if (new Date(mc.endTime).getTime() !== corrected.getTime()) set.endTime = corrected;
        }
        if (Object.keys(set).length > 0) missedCallOps.push({ _id: mc._id, set });
    }
    console.log(`MissedCall records needing correction: ${missedCallOps.length}`);

    if (!confirmed) {
        console.log('\nDry run only -- nothing was updated. Re-run with --confirm to apply.\n');
        await mongoose.disconnect();
        return;
    }

    if (commentOps.length > 0) {
        const result = await db.collection('comments').bulkWrite(
            commentOps.map(op => ({ updateOne: { filter: { _id: op._id }, update: { $set: { createdAt: op.to } } } })),
            { ordered: false }
        );
        console.log(`Updated ${result.modifiedCount} comments.`);
    }
    if (missedCallOps.length > 0) {
        const result = await db.collection('missedcalls').bulkWrite(
            missedCallOps.map(op => ({ updateOne: { filter: { _id: op._id }, update: { $set: op.set } } })),
            { ordered: false }
        );
        console.log(`Updated ${result.modifiedCount} missedcalls.`);
    }

    console.log('\n--- Done ---');
    console.log('Next: re-run fixGdmsCommentTimestamps.js, then recalcMissedCallLastInteraction.js (both with --confirm).\n');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
