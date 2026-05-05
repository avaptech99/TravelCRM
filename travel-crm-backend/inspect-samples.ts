import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CRM3');
        const db = mongoose.connection.db;
        if (!db) throw new Error('DB not found');
        
        const activities = await db.collection('activities').find({}).toArray();
        console.log('--- ACTIVITIES ---');
        console.log(JSON.stringify(activities, null, 2));
        
        const timeline = await db.collection('timeline').find({}).toArray();
        console.log('\n--- TIMELINE ---');
        console.log(JSON.stringify(timeline, null, 2));
        
        const bookingsWithSegmentsString = await db.collection('bookings').countDocuments({ segments: { $type: "string" } });
        console.log(`\n--- BOOKINGS WITH SEGMENTS AS STRING: ${bookingsWithSegmentsString} ---`);
        
        const booking = await db.collection('bookings').findOne({});
        console.log('\n--- BOOKING SAMPLE ---');
        console.log(JSON.stringify(booking, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
