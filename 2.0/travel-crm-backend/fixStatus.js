const { MongoClient } = require('mongodb');

async function fixStatus() {
    const uri = "mongodb://127.0.0.1:27017/travel_crm";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('travel_crm');
        console.log('Connected to db');

        const bookings = await db.collection('bookings').find({}).toArray();
        let updatedCount = 0;

        for (const booking of bookings) {
            if (!booking.contactId) continue;

            const lastActivity = await db.collection('activities').findOne(
                { bookingId: booking._id, action: "STATUS_CHANGE" },
                { sort: { createdAt: -1 } }
            );

            if (lastActivity) {
                console.log(`Found activity for booking ${booking._id}:`, lastActivity.details);
            }

            if (lastActivity && lastActivity.details) {
                const match = lastActivity.details.match(/to\s+([a-zA-Z\s]+)$/);
                if (match) {
                    const status = match[1].trim();
                    if (['Pending', 'Working', 'Sent', 'Booked', 'Follow up'].includes(status)) {
                        await db.collection('contacts').updateOne(
                            { _id: booking.contactId },
                            { $set: { status: status } }
                        );
                        updatedCount++;
                    } else {
                        console.log('Skipped unknown status:', status);
                    }
                }
            }
        }

        console.log(`Successfully updated ${updatedCount} contacts with their last known status from activities.`);
        
        // Let's print the new status breakdown
        const statusAggregation = await db.collection('contacts').aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();
        console.log('NEW Contact status breakdown:', statusAggregation);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await client.close();
    }
}

fixStatus();
