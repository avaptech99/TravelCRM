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
const BATCH_SIZE = 500;

if (!uri) {
    console.error('No MongoDB URI given. Pass it as an argument or set MONGODB_URI in .env.');
    process.exit(1);
}

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`\n--- Backfilling call-lead contact info: ${db.databaseName} ---`);

    const bookings = await db.collection('bookings').find({
        primaryContactId: { $exists: true, $ne: null },
        $or: [
            { 'contact.phone': { $in: [null, ''] } },
            { contact: { $exists: false } },
        ],
    }, { projection: { primaryContactId: 1, contact: 1 } }).toArray();

    console.log(`Found ${bookings.length} bookings missing contact info.`);
    if (bookings.length === 0) {
        await mongoose.disconnect();
        return;
    }

    // Fetch every linked contact in one round trip instead of one-by-one
    const contactIds = [...new Set(bookings.map(b => b.primaryContactId.toString()))]
        .map(id => new mongoose.Types.ObjectId(id));
    const contacts = await db.collection('primarycontacts')
        .find({ _id: { $in: contactIds } })
        .toArray();
    const contactById = new Map(contacts.map(c => [c._id.toString(), c]));
    console.log(`Loaded ${contacts.length} linked contacts.`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
        const batch = bookings.slice(i, i + BATCH_SIZE);
        const ops = [];

        for (const booking of batch) {
            const contact = contactById.get(booking.primaryContactId.toString());
            if (!contact || !contact.contactPhoneNo) {
                skipped++;
                continue;
            }
            ops.push({
                updateOne: {
                    filter: { _id: booking._id },
                    update: {
                        $set: {
                            contact: {
                                name: contact.contactName || 'Unknown',
                                phone: contact.contactPhoneNo,
                                type: contact.bookingType || 'Direct (B2C)',
                                requirements: contact.requirements || null,
                                interested: (booking.contact && booking.contact.interested === true) || false,
                            },
                        },
                    },
                },
            });
        }

        if (ops.length > 0) {
            const result = await db.collection('bookings').bulkWrite(ops, { ordered: false });
            updated += result.modifiedCount;
        }

        console.log(`Processed ${Math.min(i + BATCH_SIZE, bookings.length)} / ${bookings.length}...`);
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
