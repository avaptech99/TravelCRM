"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const debugMigration = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_crm');
        const db = mongoose_1.default.connection.db;
        const bookings = await db.collection('bookings').find({ contact: { $exists: false } }).limit(5).toArray();
        console.log('Sample Legacy Bookings:', JSON.stringify(bookings, null, 2));
        for (const b of bookings) {
            console.log(`Checking PrimaryContact for ID: ${b.primaryContactId}`);
            const pc = await db.collection('primarycontacts').findOne({ _id: b.primaryContactId });
            console.log(`PrimaryContact found:`, pc ? 'YES' : 'NO');
        }
        await mongoose_1.default.connection.close();
    }
    catch (err) {
        console.error(err);
    }
};
debugMigration();
