import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env before importing models
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Booking from '../models/Booking';
import Payment from '../models/Payment';

async function backfillOutstanding() {
    console.log('--- BACKFILL OUTSTANDING START ---');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI not found in environment');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const bookings = await Booking.find({});
        console.log(`Found ${bookings.length} bookings to process.`);

        let updated = 0;
        let withOutstanding = 0;

        for (const booking of bookings) {
            const payments = await Payment.find({ bookingId: booking._id });
            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const bookingTotal = booking.totalAmount || booking.amount || 0;
            const outstanding = Math.max(bookingTotal - totalPaid, 0);

            if (booking.outstanding !== outstanding) {
                booking.outstanding = outstanding;
                await booking.save();
                updated++;
            }

            if (outstanding > 0) {
                withOutstanding++;
                console.log(`  ${booking.uniqueCode}: Total=${bookingTotal}, Paid=${totalPaid}, Outstanding=${outstanding}`);
            }
        }

        console.log(`\n--- RESULTS ---`);
        console.log(`Total bookings: ${bookings.length}`);
        console.log(`Updated: ${updated}`);
        console.log(`With outstanding balance: ${withOutstanding}`);
        console.log('--- BACKFILL OUTSTANDING DONE ---');
    } catch (error) {
        console.error('Backfill failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

backfillOutstanding();
