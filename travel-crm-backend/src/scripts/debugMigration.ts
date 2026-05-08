import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const debugMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_crm');
        const db: any = mongoose.connection.db;
        const bookings = await db.collection('bookings').find({ contact: { $exists: false } }).limit(5).toArray();
        console.log('Sample Legacy Bookings:', JSON.stringify(bookings, null, 2));
        
        for (const b of bookings) {
            console.log(`Checking PrimaryContact for ID: ${b.primaryContactId}`);
            const pc = await db.collection('primarycontacts').findOne({ _id: b.primaryContactId });
            console.log(`PrimaryContact found:`, pc ? 'YES' : 'NO');
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

debugMigration();
