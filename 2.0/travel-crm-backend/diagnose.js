const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient("mongodb://127.0.0.1:27017/");
    try {
        await client.connect();
        
        const oldDb = client.db('travel-crm');
        const b = await oldDb.collection('bookings').findOne({ status: { $exists: true } });
        console.log('travel-crm bookings have status?', !!b);
        if (b) console.log('Sample status:', b.status);

        const statusAggregation = await oldDb.collection('bookings').aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();
        console.log('Old db status breakdown:', statusAggregation);

    } finally {
        await client.close();
    }
}

main().catch(console.error);
