import mongoose from 'mongoose';

// Disable autoIndex in production — Mongoose tries to create all schema indexes
// on every startup, which blocks the connection pool for 5-10+ seconds on Atlas M0.
// Indexes should be created manually via Atlas Shell or a migration script.
if (process.env.NODE_ENV === 'production') {
    mongoose.set('autoIndex', false);
}

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;

        if (!mongoURI) {
            console.error('Error: MONGODB_URI or DATABASE_URL environment variable is not defined.');
            process.exit(1);
        }

        if (mongoose.connection.readyState >= 1) {
            console.log('MongoDB is already connected.');
            return;
        }

        const conn = await mongoose.connect(mongoURI, {
            maxPoolSize: 10,    // Atlas M0 allows 500 connections; 10 prevents pool starvation
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
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
