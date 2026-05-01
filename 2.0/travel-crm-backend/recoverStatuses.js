const fs = require('fs');
const BSON = require('bson');
const { MongoClient } = require('mongodb');

async function main() {
    const backupFile = 'C:\\Users\\anmol\\OneDrive\\Desktop\\docker\\travelCRM\\bookings.bson';
    console.log(`Reading backup file from: ${backupFile}`);

    try {
        const raw = fs.readFileSync(backupFile);

        const docs = [];
        let offset = 0;
        while (offset < raw.length) {
            const size = raw.readInt32LE(offset);
            const doc = BSON.deserialize(raw.slice(offset, offset + size));
            docs.push(doc);
            offset += size;
        }

        console.log(`Read ${docs.length} booking documents from backup`);
        
        const statusMap = {};
        const interestedMap = {};

        docs.forEach(doc => {
            if (doc._id) {
                if (doc.status) {
                    statusMap[doc._id.toString()] = doc.status;
                }
                if (doc.interested !== undefined) {
                    interestedMap[doc._id.toString()] = doc.interested;
                }
            }
        });

        console.log('Status distribution in backup:');
        const dist = {};
        Object.values(statusMap).forEach(s => dist[s] = (dist[s] || 0) + 1);
        console.log(dist);

        console.log('\nConnecting to MongoDB...');
        const client = new MongoClient('mongodb://127.0.0.1:27017/travel_crm');
        await client.connect();
        const db = client.db('travel_crm');

        let updated = 0;
        let notFound = 0;

        const allBookings = await db.collection('bookings').find({}).toArray();

        for (const booking of allBookings) {
            if (!booking.contactId) continue;

            const backupStatus = statusMap[booking._id.toString()];
            const backupInterested = interestedMap[booking._id.toString()];

            if (backupStatus || backupInterested !== undefined) {
                const updateFields = {};
                if (backupStatus) updateFields.status = backupStatus;
                if (backupInterested !== undefined) updateFields.interested = backupInterested;

                await db.collection('contacts').updateOne(
                    { _id: booking.contactId },
                    { $set: updateFields }
                );
                updated++;
            } else {
                notFound++;
            }
        }

        console.log(`\nUpdated: ${updated} contacts`);
        console.log(`No backup data found for: ${notFound} bookings`);

        console.log('\nFinal Contact status breakdown:');
        const statusAggregation = await db.collection('contacts').aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();
        console.log(statusAggregation);

        await client.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

main();
