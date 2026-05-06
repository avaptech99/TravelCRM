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
        mongoose_1.default.connection.once('connected', async () => {
            console.log('MongoDB Connected. Synchronizing indexes...');
            try {
                // Forces MongoDB to create missing indexes AND drop unused stale indexes
                await Booking_1.default.syncIndexes();
                await Payment_1.default.syncIndexes();
                console.log('✅ Index synchronization complete (all performance indexes applied)');
            }
            catch (err) {
                console.error('⚠️ Index sync error:', err);
            }
        });
        if (mongoose_1.default.connection.readyState >= 1) {
            console.log('MongoDB is already connected.');
            return;
        }
        const conn = await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 20, // Increased to handle parallel bursts
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            autoIndex: true, // Must be true so schemas register indexes
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
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
