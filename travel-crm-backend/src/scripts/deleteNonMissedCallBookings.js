/**
 * DESTRUCTIVE. Deletes every Booking document that is NOT a missed call
 * (callDisposition !== 'MISSED'). This includes real customer bookings,
 * in-progress leads, answered calls, and outbound calls -- anything that
 * isn't a missed-call stub. There is no undo.
 *
 * Back up the `bookings` collection before running this with --confirm:
 *   mongodump --uri "<MONGODB_URI>" --collection bookings --out ./backup
 *
 * Dry run (default, deletes nothing, just reports what WOULD be deleted):
 *   cd travel-crm-backend
 *   node src/scripts/deleteNonMissedCallBookings.js "<MONGODB_URI>"
 *
 * Actually delete (irreversible):
 *   node src/scripts/deleteNonMissedCallBookings.js "<MONGODB_URI>" --confirm
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
    const filter = { callDisposition: { $ne: 'MISSED' } };

    const toDelete = await db.collection('bookings').countDocuments(filter);
    const toKeep = await db.collection('bookings').countDocuments({ callDisposition: 'MISSED' });

    console.log(`\n--- ${db.databaseName} ---`);
    console.log(`Bookings that would be KEPT (callDisposition === 'MISSED'): ${toKeep}`);
    console.log(`Bookings that would be DELETED (everything else):          ${toDelete}`);

    if (!confirmed) {
        console.log('\nDry run only -- nothing was deleted. Re-run with --confirm to actually delete.\n');
        await mongoose.disconnect();
        return;
    }

    console.log('\n--confirm passed. Deleting now...');
    const result = await db.collection('bookings').deleteMany(filter);
    console.log(`Deleted ${result.deletedCount} bookings.\n`);

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
