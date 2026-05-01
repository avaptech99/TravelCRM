import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
// Load env vars
dotenv.config();

// Route files
// Route files
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import syncRoutes from './routes/syncRoutes';
import externalRoutes from './routes/externalRoutes';
import connectDB from './config/db';
import { startSelfPinging } from './utils/keepWarm';

const app: Express = express();
const httpServer = http.createServer(app);

// Connect to MongoDB
connectDB();

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

// Prevent aggressive caching from CDNs/browsers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/external', externalRoutes);

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

httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Socket.io] WebSocket server initialized on port ${PORT}`);

    // Start self-pinging to keep server warm (if BASE_URL is provided)
    if (process.env.BASE_URL) {
        startSelfPinging(process.env.BASE_URL);
    }
});
