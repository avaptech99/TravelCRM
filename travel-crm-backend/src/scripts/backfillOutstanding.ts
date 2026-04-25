import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env (local fallback)
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Booking from '../models/Booking';
import Payment from '../models/Payment';

async function backfillOutstanding() {
    // Allow passing MongoDB URI as CLI argument for production use
    const mongoUri = process.argv[2] || process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('Usage: npx ts-node backfillOutstanding.ts [MONGODB_URI]');
        console.error('Or set MONGODB_URI in .env');
        process.exit(1);
    }

    console.log('--- BACKFILL OUTSTANDING ---');
    console.log(`Connecting to: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

    await mongoose.connect(mongoUri);
    console.log('Connected');

    const bookings = await Booking.find({}).lean();
    console.log(`Found ${bookings.length} bookings`);

    let updated = 0;
    let withOutstanding = 0;

    for (const booking of bookings) {
        const payments = await Payment.find({ bookingId: booking._id }).lean();
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const bookingTotal = booking.totalAmount || booking.amount || 0;
        const outstanding = Math.max(bookingTotal - totalPaid, 0);

        await Booking.updateOne(
            { _id: booking._id },
            { $set: { outstanding } }
        );
        updated++;

        if (outstanding > 0) {
            withOutstanding++;
            console.log(`  ${booking.uniqueCode}: Total=${bookingTotal}, Paid=${totalPaid}, Outstanding=${outstanding}`);
        }
    }

    // Verify
    const withField = await Booking.countDocuments({ outstanding: { $exists: true } });
    const gt0 = await Booking.countDocuments({ outstanding: { $gt: 0 } });
    
    console.log(`\n--- RESULTS ---`);
    console.log(`Total: ${bookings.length}, Updated: ${updated}`);
    console.log(`With outstanding > 0: ${withOutstanding}`);
    console.log(`DB verification: ${withField} have field, ${gt0} have outstanding > 0`);
    console.log('--- DONE ---');

    await mongoose.disconnect();
}

backfillOutstanding();
