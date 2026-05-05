import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

// Load env vars
dotenv.config();

// Route files
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import syncRoutes from './routes/syncRoutes';
import externalRoutes from './routes/externalRoutes';
import settingsRoutes from './routes/settingsRoutes';
import connectDB from './config/db';
import { startSelfPinging } from './utils/keepWarm';
import { startFollowUpCron } from './utils/followUpCron';
// Socket.io is available in ./socket.ts for future real-time upgrades
import User from './models/User';
import Booking from './models/Booking';
import Payment from './models/Payment';
import bcrypt from 'bcrypt';

const app: Express = express();

// Connect to MongoDB
connectDB();

// Gzip compression — ~70% smaller API responses
app.use(compression());

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from localhost (dev) and any Railway/Vercel domain (prod)
        if (!origin || origin.match(/^https?:\/\/localhost:\d+$/) || origin.match(/\.up\.railway\.app$/) || origin.match(/\.vercel\.app$/)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for now in production
        }
    },
    credentials: true,
}));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('tiny')); // Show minimal logs in production
}

// Note: Anti-cache headers removed — React Query handles cache invalidation on the frontend.
// Letting browsers cache GET responses reduces redundant network requests.

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/settings', settingsRoutes);

// Ping route for keeping server warm
app.get('/api/ping', (req: Request, res: Response) => {
    res.status(200).send('pong');
});

// Health endpoint for UptimeRobot
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Basic health check route
app.get('/', (req: Request, res: Response) => {
    res.send('Travel CRM Backend API is running...');
});

// Test DB route
app.get('/test-db', async (req: Request, res: Response) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        if (isConnected) {
            res.json({ message: "MongoDB connected successfully", host: mongoose.connection.host });
        } else {
            res.status(500).json({ message: "MongoDB connection error: Database not connected", readyState: mongoose.connection.readyState });
        }
    } catch (error) {
        res.status(500).json({ message: "MongoDB connection error", error });
    }
});

// Custom Error Handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

// Auto-seed admin user + backfill outstanding on startup
mongoose.connection.once('open', async () => {
    // Run heavy migrations and startup tasks in background to avoid blocking server readiness
    (async () => {
        try {
            const count = await User.countDocuments();
            if (count === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await User.create({
                    name: 'Admin',
                    email: 'admin@travel.com',
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                });
                console.log('Default admin user created');
            }

            startFollowUpCron();
            
            console.log('🚀 Startup tasks complete. System ready.');
        } catch (error) {
            console.error('[Startup Task Error]:', error);
        }
    })();
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

    // Start self-pinging to keep server warm
    if (process.env.BASE_URL) {
        startSelfPinging(process.env.BASE_URL);
    } else {
        console.warn('⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.');
    }
});

