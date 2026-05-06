"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const Booking_1 = __importDefault(require("../models/Booking"));
async function countAll() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('No MONGODB_URI');
        process.exit(1);
    }
    await mongoose_1.default.connect(mongoUri);
    const totalBookings = await Booking_1.default.countDocuments();
    const withOutstandingField = await Booking_1.default.countDocuments({ outstanding: { $exists: true } });
    const withOutstandingGt0 = await Booking_1.default.countDocuments({ outstanding: { $gt: 0 } });
    const withOutstandingEq0 = await Booking_1.default.countDocuments({ outstanding: 0 });
    const withoutOutstandingField = await Booking_1.default.countDocuments({ outstanding: { $exists: false } });
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`With outstanding field: ${withOutstandingField}`);
    console.log(`Outstanding > 0: ${withOutstandingGt0}`);
    console.log(`Outstanding = 0: ${withOutstandingEq0}`);
    console.log(`Missing outstanding field: ${withoutOutstandingField}`);
    await mongoose_1.default.disconnect();
}
countAll();
