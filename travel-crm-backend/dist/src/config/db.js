"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Payment_1 = __importDefault(require("../models/Payment"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
        if (!mongoURI) {
            console.error('Error: MONGODB_URI or DATABASE_URL is not defined in environment variables.');
            process.exit(1);
        }
        const conn = await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 10, // Optimized for efficiency without saturating Render instance
            minPoolSize: 2,
            waitQueueTimeoutMS: 3000, // Error out quickly to avoid resource hanging
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            autoIndex: false, // Better for production performance
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // BACKGROUND: Index synchronization
        setImmediate(async () => {
            console.log('Synchronizing indexes in background...');
            try {
                await Promise.all([
                    Booking_1.default.syncIndexes(),
                    Payment_1.default.syncIndexes()
                ]);
                console.log('✅ Index synchronization complete');
            }
            catch (err) {
                console.error('⚠️ Index sync error:', err);
            }
        });
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
