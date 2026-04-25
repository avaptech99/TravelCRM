import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Booking from '../models/Booking';
import Payment from '../models/Payment';

async function countAll() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) { console.error('No MONGODB_URI'); process.exit(1); }

    await mongoose.connect(mongoUri);
    
    const totalBookings = await Booking.countDocuments();
    const withOutstandingField = await Booking.countDocuments({ outstanding: { $exists: true } });
    const withOutstandingGt0 = await Booking.countDocuments({ outstanding: { $gt: 0 } });
    const withOutstandingEq0 = await Booking.countDocuments({ outstanding: 0 });
    const withoutOutstandingField = await Booking.countDocuments({ outstanding: { $exists: false } });
    
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`With outstanding field: ${withOutstandingField}`);
    console.log(`Outstanding > 0: ${withOutstandingGt0}`);
    console.log(`Outstanding = 0: ${withOutstandingEq0}`);
    console.log(`Missing outstanding field: ${withoutOutstandingField}`);

    await mongoose.disconnect();
}

countAll();
