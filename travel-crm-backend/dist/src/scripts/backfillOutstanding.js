"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env (local fallback)
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const Booking_1 = __importDefault(require("../models/Booking"));
const Payment_1 = __importDefault(require("../models/Payment"));
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
    await mongoose_1.default.connect(mongoUri);
    console.log('Connected');
    const bookings = await Booking_1.default.find({}).lean();
    console.log(`Found ${bookings.length} bookings`);
    let updated = 0;
    let withOutstanding = 0;
    for (const booking of bookings) {
        const payments = await Payment_1.default.find({ bookingId: booking._id }).lean();
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const bookingTotal = booking.totalAmount || booking.amount || 0;
        const outstanding = Math.max(bookingTotal - totalPaid, 0);
        await Booking_1.default.updateOne({ _id: booking._id }, { $set: { outstanding } });
        updated++;
        if (outstanding > 0) {
            withOutstanding++;
            console.log(`  ${booking.uniqueCode}: Total=${bookingTotal}, Paid=${totalPaid}, Outstanding=${outstanding}`);
        }
    }
    // Verify
    const withField = await Booking_1.default.countDocuments({ outstanding: { $exists: true } });
    const gt0 = await Booking_1.default.countDocuments({ outstanding: { $gt: 0 } });
    console.log(`\n--- RESULTS ---`);
    console.log(`Total: ${bookings.length}, Updated: ${updated}`);
    console.log(`With outstanding > 0: ${withOutstanding}`);
    console.log(`DB verification: ${withField} have field, ${gt0} have outstanding > 0`);
    console.log('--- DONE ---');
    await mongoose_1.default.disconnect();
}
backfillOutstanding();
