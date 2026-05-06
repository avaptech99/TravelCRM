import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Payment from '../models/Payment';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;

        if (!mongoURI) {
            console.error('Error: MONGODB_URI or DATABASE_URL is not defined in environment variables.');
            process.exit(1);
        }

        mongoose.connection.once('connected', async () => {
            console.log('MongoDB Connected. Synchronizing indexes...');
            try {
                // Forces MongoDB to create missing indexes AND drop unused stale indexes
                await Booking.syncIndexes();
                await Payment.syncIndexes();
                console.log('✅ Index synchronization complete (all performance indexes applied)');
            } catch (err) {
                console.error('⚠️ Index sync error:', err);
            }
        });

        if (mongoose.connection.readyState >= 1) {
            console.log('MongoDB is already connected.');
            return;
        }

        const conn = await mongoose.connect(mongoURI, {
            maxPoolSize: 10,    // Optimized for Free Tier (prevents connection leaks)
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            autoIndex: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Graceful shutdown handlers
        const gracefulExit = async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        };

        process.on('SIGINT', gracefulExit);
        process.on('SIGTERM', gracefulExit);

    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred');
        }
        process.exit(1);
    }
};

export default connectDB;
