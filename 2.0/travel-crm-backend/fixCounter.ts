import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import Booking from './src/models/Booking';
import Counter from './src/models/Counter';

async function fixCounter() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_crm');
    console.log('Connected');

    try {
        // Find highest TWXXXX code
        const bookings = await Booking.find({ uniqueCode: /^TW\d+$/ }).lean();
        let maxSeq = 0;
        
        for (const b of bookings) {
            const code = b.uniqueCode;
            if (code) {
                const num = parseInt(code.replace('TW', ''), 10);
                if (!isNaN(num) && num > maxSeq) {
                    maxSeq = num;
                }
            }
        }
        
        console.log('Highest booking sequence found in DB:', maxSeq);
        
        if (maxSeq > 0) {
            const result = await Counter.findOneAndUpdate(
                { _id: 'bookingId' },
                { $set: { seq: maxSeq } },
                { upsert: true, returnDocument: 'after' }
            );
            console.log('Updated Counter to:', result?.seq);
        }

    } catch (e: any) {
        console.error('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixCounter();
