/**
 * Backfill script: fills in contact.name/contact.phone/contact.type on Booking
 * documents created by the phone webhook before it started saving that block
 * (bookings whose Contact Person / Contact Number columns show "-" in the UI).
 *
 * Run with plain Node (no mongosh install needed, uses the mongoose already
 * in node_modules):
 *   cd travel-crm-backend
 *   node src/scripts/backfillCallLeadContacts.js "<MONGODB_URI>"
 *
 * Or omit the argument to fall back to MONGODB_URI from .env.
 */

const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

// mongodb+srv:// needs DNS SRV record lookups, which some Windows/ISP/VPN
// resolvers can't do (ECONNREFUSED on querySrv). Use a public resolver instead.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri) {
    console.error('No MongoDB URI given. Pass it as an argument or set MONGODB_URI in .env.');
    process.exit(1);
}

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`\n--- Backfilling call-lead contact info: ${db.databaseName} ---`);

    const cursor = db.collection('bookings').find({
        primaryContactId: { $exists: true, $ne: null },
        $or: [
            { 'contact.phone': { $in: [null, ''] } },
            { contact: { $exists: false } },
        ],
    });

    let updated = 0;
    let skipped = 0;

    while (await cursor.hasNext()) {
        const booking = await cursor.next();
        const contact = await db.collection('primarycontacts').findOne({ _id: booking.primaryContactId });

        if (!contact || !contact.contactPhoneNo) {
            skipped++;
            continue;
        }

        await db.collection('bookings').updateOne(
            { _id: booking._id },
            {
                $set: {
                    contact: {
                        name: contact.contactName || 'Unknown',
                        phone: contact.contactPhoneNo,
                        type: contact.bookingType || 'Direct (B2C)',
                        requirements: contact.requirements || null,
                        interested: (booking.contact && booking.contact.interested === true) || false,
                    },
                },
            }
        );
        updated++;
    }

    console.log(`\n   - Updated: ${updated}`);
    console.log(`   - Skipped (no linked contact/phone): ${skipped}`);
    console.log('\n--- Done ---\n');

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
