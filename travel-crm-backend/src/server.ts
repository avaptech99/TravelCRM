import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { perfMonitor } from './middleware/perfMonitor';

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
import { startFollowUpCron } from './utils/followUpCron';
// Socket.io is available in ./socket.ts for future real-time upgrades
import User from './models/User';
import Booking from './models/Booking';
import Payment from './models/Payment';
import bcrypt from 'bcrypt';

const app: Express = express();

// Connect to MongoDB
connectDB();

// Gzip compression
app.use(compression());

// Body parser
app.use(express.json());

// Performance monitoring middleware
app.use(perfMonitor);
import { pollLogger } from './middleware/pollLogger';
import { requestCounter } from './middleware/requestCounter';

app.use(requestCounter);
app.use(pollLogger);




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

import cluster from 'cluster';
import { warmDropdownCache } from './controllers/settingsController';

const PORT = process.env.PORT || 5000;

if (cluster.isPrimary) {
    const numWorkers = parseInt(process.env.WEB_CONCURRENCY || '1');
    console.log(`[PRIMARY] ${process.pid} is running. Forking ${numWorkers} workers...`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`[WORKER] ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

    // Run master-only background tasks (Cron)
    connectDB().then(async () => {
        await warmDropdownCache();
        startFollowUpCron();
        console.log('🚀 Primary startup tasks complete.');
    });

} else {
    // Workers - each handles requests in parallel
    const startWorker = async () => {
        try {
            await connectDB();
            await warmDropdownCache();
            app.listen(Number(PORT), '0.0.0.0', () => {
                console.log(`[WORKER] ${process.pid} started on port ${PORT}`);
            });
        } catch (err) {
            console.error(`[WORKER] ${process.pid} failed to start:`, err);
            process.exit(1);
        }
    };

    startWorker();
}


