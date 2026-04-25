"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env before importing models
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const Booking_1 = __importDefault(require("../models/Booking"));
const Payment_1 = __importDefault(require("../models/Payment"));
async function backfillOutstanding() {
    console.log('--- BACKFILL OUTSTANDING START ---');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI not found in environment');
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        const bookings = await Booking_1.default.find({});
        console.log(`Found ${bookings.length} bookings to process.`);
        let updated = 0;
        let withOutstanding = 0;
        for (const booking of bookings) {
            const payments = await Payment_1.default.find({ bookingId: booking._id });
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
    }
    catch (error) {
        console.error('Backfill failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
backfillOutstanding();
