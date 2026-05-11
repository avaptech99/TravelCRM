"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = __importDefault(require("../models/Booking"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
        if (!mongoURI) {
            console.error('Error: MONGODB_URI or DATABASE_URL is not defined in environment variables.');
            process.exit(1);
        }
        const conn = await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 25,
            minPoolSize: 5,
            waitQueueTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 10000,
            autoIndex: false,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host} | Database: ${conn.connection.name}`);
        // BACKGROUND: Optional index check (non-blocking)
        if (process.env.SYNC_INDEXES === 'true') {
            setImmediate(async () => {
                console.log('Background Index Sync Started...');
                try {
                    await Booking_1.default.syncIndexes();
                    console.log('✅ Index synchronization complete');
                }
                catch (err) {
                    console.error('⚠️ Index sync error:', err);
                }
            });
        }
        // Graceful shutdown handlers
        const gracefulExit = async () => {
            await mongoose_1.default.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        };
        process.on('SIGINT', gracefulExit);
        process.on('SIGTERM', gracefulExit);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('An unknown error occurred');
        }
        process.exit(1);
    }
};
exports.default = connectDB;
