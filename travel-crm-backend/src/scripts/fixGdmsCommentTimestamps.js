/**
 * Rewrites the embedded "Start: HH:MM | End: HH:MM" (and the "on DD/M/YYYY"
 * date) inside existing GDMS call-log comments ("Missed Call from ...",
 * "Answered Call from ...", "Outbound Call from ...") to America/Toronto
 * time. These were generated server-side using the raw server-local clock
 * (Render runs in UTC), so old comments show e.g. "Start: 07:19" for a call
 * that was actually 3:19 AM in Toronto -- while the comment's own timestamp
 * badge (rendered client-side) already shows the correct Toronto time,
 * producing a visible mismatch. The webhook itself was already fixed to
 * stop making this mistake going forward -- this only corrects text already
 * in the DB.
 *
 * The comment's own createdAt was always set to the true call start instant
 * (see webhookController.ts), so it's used as the source of truth for
 * "Start". "End" is re-derived as Start + Duration seconds (Asterisk CDRs
 * define duration as end - start), except where the original text already
 * said "End: N/A" (no end time was ever recorded for that leg) -- that's
 * left as N/A rather than fabricating one.
 *
 * Does NOT touch createdAt, callDisposition, pbxCallId, lastInteractionAt,
 * or any other field -- text only.
 *
 * Dry run (default, updates nothing, just reports how many rows would change):
 *   cd travel-crm-backend
 *   node src/scripts/fixGdmsCommentTimestamps.js "<MONGODB_URI>"
 *
 * Apply:
 *   node src/scripts/fixGdmsCommentTimestamps.js "<MONGODB_URI>" --confirm
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
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}
function formatDate(date) {
    const p = torontoParts(date);
    return `${p.day}/${p.month}/${p.year}`;
}
function formatTime(date) {
    const p = torontoParts(date);
    return `${p.hour}:${p.minute}`;
}

// Matches the exact shape webhookController.ts's commentText builds:
// "<Type> from <Name> on <D/M/Y> | Start: HH:MM | End: (HH:MM|N/A) | Duration: Ns | Billsec: Ns<suffix>"
const COMMENT_RE = /^(Missed Call|Answered Call|Outbound Call) from (.+?) on \d{1,2}\/\d{1,2}\/\d{4} \| Start: \d{2}:\d{2} \| End: (?:\d{2}:\d{2}|N\/A) \| Duration: (\d+)s \| Billsec: (\d+)s(.*)$/;

function rebuild(text, createdAt) {
    const m = text.match(COMMENT_RE);
    if (!m) return null;
    const [, callType, name, durationStr, billsecStr, suffix] = m;
    const hadNoEnd = /End: N\/A/.test(text);
    const duration = parseInt(durationStr, 10);

    const dateStr = formatDate(createdAt);
    const startStr = formatTime(createdAt);
    const endStr = hadNoEnd ? 'N/A' : formatTime(new Date(createdAt.getTime() + duration * 1000));

    return `${callType} from ${name} on ${dateStr} | Start: ${startStr} | End: ${endStr} | Duration: ${duration}s | Billsec: ${billsecStr}s${suffix}`;
}

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`\n--- Fixing GDMS comment timestamps to America/Toronto: ${db.databaseName} ---`);

    const comments = await db.collection('comments')
        .find({ text: { $regex: '^(Missed Call|Answered Call|Outbound Call) from .+ \\| Start: ' } })
        .project({ text: 1, createdAt: 1 })
        .toArray();
    console.log(`Found ${comments.length} GDMS call-log comments.`);

    const ops = [];
    let unparsed = 0;
    for (const c of comments) {
        const rebuilt = rebuild(c.text, new Date(c.createdAt));
        if (!rebuilt) {
            unparsed++;
            continue;
        }
        if (rebuilt !== c.text) {
            ops.push({ updateOne: { filter: { _id: c._id }, update: { $set: { text: rebuilt } } } });
        }
    }

    console.log(`Comments needing correction: ${ops.length}`);
    if (unparsed > 0) console.log(`Comments that didn't match the expected shape (left untouched): ${unparsed}`);

    if (ops.length > 0) {
        console.log('\nSample changes:');
        for (const op of ops.slice(0, 3)) {
            const original = comments.find(c => c._id.equals(op.updateOne.filter._id));
            console.log(`  - ${original.text}`);
            console.log(`  + ${op.updateOne.update.$set.text}\n`);
        }
    }

    if (!confirmed) {
        console.log('Dry run only -- nothing was updated. Re-run with --confirm to apply.\n');
        await mongoose.disconnect();
        return;
    }

    if (ops.length > 0) {
        const result = await db.collection('comments').bulkWrite(ops, { ordered: false });
        console.log(`Updated ${result.modifiedCount} comments.`);
    }

    console.log('\n--- Done ---\n');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
