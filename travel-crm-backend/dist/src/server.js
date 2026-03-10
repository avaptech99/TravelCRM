"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
// Load env vars
dotenv_1.default.config();
// Route files
// Route files
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const db_1 = __importDefault(require("./config/db"));
const app = (0, express_1.default)();
// Connect to MongoDB
(0, db_1.default)();
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
// Dev logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
// Prevent aggressive caching from CDNs/browsers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
// Mount routers
app.use('/api/auth', authRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
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
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
