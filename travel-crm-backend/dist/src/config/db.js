"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
        if (!mongoURI) {
            console.error('Error: MONGODB_URI or DATABASE_URL environment variable is not defined.');
            process.exit(1);
        }
        if (mongoose_1.default.connection.readyState >= 1) {
            console.log('MongoDB is already connected.');
            return;
        }
        const conn = await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 5, // Right-sized for free tier (0.1 CPU, 15 users)
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
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
