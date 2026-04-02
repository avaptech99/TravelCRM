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
const db_1 = __importDefault(require("./config/db"));
const keepWarm_1 = require("./utils/keepWarm");
// Socket.io is available in ./socket.ts for future real-time upgrades
const User_1 = __importDefault(require("./models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
// Connect to MongoDB
(0, db_1.default)();
// Gzip compression — ~70% smaller API responses
app.use((0, compression_1.default)());
// Body parser
app.use(express_1.default.json());
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
const PORT = process.env.PORT || 5000;
// Auto-seed admin user if the database is completely empty
mongoose_1.default.connection.once('open', async () => {
    try {
        const count = await User_1.default.countDocuments();
        if (count === 0) {
            console.log('Auto-Seeder: Database is empty! Creating default admin user...');
            const adminPasswordHash = await bcrypt_1.default.hash('admin123', 10);
            await User_1.default.create({
                name: 'System Admin',
                email: 'admin@travel.com',
                passwordHash: adminPasswordHash,
                role: 'ADMIN',
            });
            console.log('Auto-Seeder: Admin user created successfully. You can now log in.');
        }
    }
    catch (error) {
        console.error('Auto-Seeder Error:', error);
    }
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    // Start self-pinging to keep server warm (if BASE_URL is provided)
    if (process.env.BASE_URL) {
        (0, keepWarm_1.startSelfPinging)(process.env.BASE_URL);
    }
});
