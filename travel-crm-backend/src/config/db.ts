import mongoose from 'mongoose';

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
            maxPoolSize: 20,
            minPoolSize: 5,
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
