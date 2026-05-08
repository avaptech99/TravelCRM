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

        const conn = await mongoose.connect(mongoURI, {
            dbName: process.env.DB_NAME || 'TESTDATA', // Force TESTDATA as the primary database
            maxPoolSize: 25,    // Optimized for 1 clustered worker (50 total if concurrency increased)
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
                    await Booking.syncIndexes();
                    console.log('✅ Index synchronization complete');
                } catch (err) {
                    console.error('⚠️ Index sync error:', err);
                }
            });
        }


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
