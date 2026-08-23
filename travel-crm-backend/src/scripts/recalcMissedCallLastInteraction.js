/**
 * Corrects lastInteractionAt on existing missed-call leads (callDisposition
 * === 'MISSED') so the All Leads sort reflects the new rule: only a missed
 * call should have bumped it, not an answered/outbound call on the same
 * contact. This only fixes data already in the DB -- the webhook itself was
 * already fixed to stop making this mistake going forward.
 *
 * For each MISSED booking, sets lastInteractionAt to the latest "Missed
 * Call from ..." comment's createdAt (falling back to the booking's own
 * createdAt if it has no missed-call comment yet).
 *
 * Dry run (default, updates nothing, just reports how many rows would change):
 *   cd travel-crm-backend
 *   node src/scripts/recalcMissedCallLastInteraction.js "<MONGODB_URI>"
 *
 * Apply:
 *   node src/scripts/recalcMissedCallLastInteraction.js "<MONGODB_URI>" --confirm
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

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`\n--- Recalculating missed-call lastInteractionAt: ${db.databaseName} ---`);

    const bookings = await db.collection('bookings')
        .find({ callDisposition: 'MISSED' }, { projection: { createdAt: 1, lastInteractionAt: 1 } })
        .toArray();
    console.log(`Found ${bookings.length} missed-call bookings.`);

    const comments = await db.collection('comments')
        .find(
            { bookingId: { $in: bookings.map(b => b._id) }, text: { $regex: '^Missed Call from' } },
            { projection: { bookingId: 1, createdAt: 1 } }
        )
        .toArray();

    const latestMissedByBooking = new Map();
    for (const c of comments) {
        const key = c.bookingId.toString();
        const existing = latestMissedByBooking.get(key);
        if (!existing || c.createdAt > existing) latestMissedByBooking.set(key, c.createdAt);
    }

    const ops = [];
    for (const b of bookings) {
        const target = latestMissedByBooking.get(b._id.toString()) || b.createdAt;
        const current = b.lastInteractionAt;
        if (!current || target.getTime() !== new Date(current).getTime()) {
            ops.push({ updateOne: { filter: { _id: b._id }, update: { $set: { lastInteractionAt: target } } } });
        }
    }

    console.log(`Bookings needing correction: ${ops.length}`);

    if (!confirmed) {
        console.log('\nDry run only -- nothing was updated. Re-run with --confirm to apply.\n');
        await mongoose.disconnect();
        return;
    }

    if (ops.length > 0) {
        const result = await db.collection('bookings').bulkWrite(ops, { ordered: false });
        console.log(`Updated ${result.modifiedCount} bookings.`);
    }

    console.log('\n--- Done ---\n');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
