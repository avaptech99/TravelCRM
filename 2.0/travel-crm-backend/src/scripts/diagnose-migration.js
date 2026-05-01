const { MongoClient } = require('mongodb');

async function diagnose() {
    const client = new MongoClient("mongodb://127.0.0.1:27017/travel_crm");
    try {
        await client.connect();
        const db = client.db("travel_crm");
        const bookings = db.collection('bookings');

        console.log('--- Diagnosis Results ---');

        // 1. Check one document
        const sample = await bookings.findOne({}, { 
            projection: { amount: 1, totalAmount: 1, lumpSumAmount: 1, pricePerTicket: 1 } 
        });
        console.log('Sample booking:', JSON.stringify(sample, null, 2));

        // 2. Count lumpSumAmount > 0
        const countLump = await bookings.countDocuments({ lumpSumAmount: { $gt: 0 } });
        console.log('Count lumpSumAmount > 0:', countLump);

        // 3. Count totalAmount > 0
        const countTotal = await bookings.countDocuments({ totalAmount: { $gt: 0 } });
        console.log('Count totalAmount > 0:', countTotal);

        // 4. Count amount > 0
        const countAmount = await bookings.countDocuments({ amount: { $gt: 0 } });
        console.log('Count amount > 0:', countAmount);

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

diagnose();
