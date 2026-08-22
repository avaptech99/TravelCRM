"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const perfMonitor_1 = require("./middleware/perfMonitor");
// Load env vars
dotenv_1.default.config();
// Route files
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const syncRoutes_1 = __importDefault(require("./routes/syncRoutes"));
const externalRoutes_1 = __importDefault(require("./routes/externalRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const db_1 = __importDefault(require("./config/db"));
const followUpCron_1 = require("./utils/followUpCron");
const sseRoutes_1 = __importDefault(require("./routes/sseRoutes"));
const sseManager_1 = require("./sse/sseManager");
const app = (0, express_1.default)();
// Connect to MongoDB
(0, db_1.default)();
// Gzip compression
app.use((0, compression_1.default)());
// Body parser
app.use(express_1.default.json());
// Performance monitoring middleware
app.use(perfMonitor_1.perfMonitor);
const pollLogger_1 = require("./middleware/pollLogger");
const requestCounter_1 = require("./middleware/requestCounter");
app.use(requestCounter_1.requestCounter);
app.use(pollLogger_1.pollLogger);
// Enable CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests from localhost (dev) and any Railway/Vercel domain (prod)
        if (!origin || origin.match(/^https?:\/\/localhost:\d+$/) || origin.match(/\.up\.railway\.app$/) || origin.match(/\.vercel\.app$/)) {
            callback(null, true);
        }
        else {
            callback(null, true); // Allow all origins for now in production
        }
    },
    credentials: true,
}));
// Mount SSE route (BEFORE other routes, no body parsing needed for the stream itself)
app.use('/api/stream', sseRoutes_1.default);
// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('tiny')); // Show minimal logs in production
}
// Note: Anti-cache headers removed — React Query handles cache invalidation on the frontend.
// Letting browsers cache GET responses reduces redundant network requests.
// Mount routers
app.use('/api/auth', authRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/sync', syncRoutes_1.default);
app.use('/api/external', externalRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
// Ping route for keeping server warm
app.get('/api/ping', (req, res) => {
    res.status(200).send('pong');
});
// Health endpoint for UptimeRobot
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Basic health check route
app.get('/', (req, res) => {
    res.send('Travel CRM Backend API is running...');
});
// Test DB route
app.get('/test-db', async (req, res) => {
    try {
        const isConnected = mongoose_1.default.connection.readyState === 1;
        if (isConnected) {
            res.json({ message: "MongoDB connected successfully", host: mongoose_1.default.connection.host });
        }
        else {
            res.status(500).json({ message: "MongoDB connection error: Database not connected", readyState: mongoose_1.default.connection.readyState });
        }
    }
    catch (error) {
        res.status(500).json({ message: "MongoDB connection error", error });
    }
});
// Custom Error Handler middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});
const cluster_1 = __importDefault(require("cluster"));
const settingsController_1 = require("./controllers/settingsController");
const cacheWarm_1 = require("./utils/cacheWarm");
const PORT = process.env.PORT || 5000;
if (cluster_1.default.isPrimary) {
    const numWorkers = parseInt(process.env.WEB_CONCURRENCY || '1');
    console.log(`[PRIMARY] ${process.pid} is running. Forking ${numWorkers} workers...`);
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`[WORKER] ${worker.process.pid} died. Restarting...`);
        cluster_1.default.fork();
    });
    // Run master-only background tasks (Cron)
    (0, db_1.default)().then(async () => {
        await Promise.all([
            (0, settingsController_1.warmDropdownCache)(),
            (0, cacheWarm_1.warmCaches)()
        ]);
        (0, followUpCron_1.startFollowUpCron)();
        console.log('🚀 Primary startup tasks complete.');
    });
}
else {
    // Workers - each handles requests in parallel
    const startWorker = async () => {
        try {
            await (0, db_1.default)();
            await Promise.all([
                (0, settingsController_1.warmDropdownCache)(),
                (0, cacheWarm_1.warmCaches)()
            ]);
            // Start SSE heartbeat in worker
            (0, sseManager_1.startSSEHeartbeat)();
            app.listen(Number(PORT), '0.0.0.0', () => {
                console.log(`[WORKER] ${process.pid} started on port ${PORT}`);
            });
        }
        catch (err) {
            console.error(`[WORKER] ${process.pid} failed to start:`, err);
            process.exit(1);
        }
    };
    startWorker();
}
// Graceful shutdown
const handleShutdown = async (signal) => {
    console.log(`[${signal}] Received. Shutting down gracefully...`);
    (0, sseManager_1.shutdownSSE)();
    if (mongoose_1.default.connection.readyState === 1) {
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed.');
    }
    process.exit(0);
};
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
