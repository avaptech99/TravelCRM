"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cluster_1 = __importDefault(require("cluster"));
const path_1 = __importDefault(require("path"));
if (cluster_1.default.isPrimary) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoose = require('mongoose');
    const bcrypt = require('bcrypt');
    async function start() {
        console.log('Starting in-memory MongoDB for E2E tests...');
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        // Set the environment variable so the backend connects to this database
        process.env.MONGODB_URI = uri;
        process.env.PORT = '5000'; // Make sure it runs on port 5000
        // Connect first to seed the data
        await mongoose.connect(uri);
        console.log('Connected to in-memory MongoDB. Seeding users...');
        // Import models
        const User = require('./models/User').default;
        const Booking = require('./models/Booking').default;
        const PrimaryContact = require('./models/PrimaryContact').default;
        // Clear existing data
        await User.deleteMany({});
        await Booking.deleteMany({});
        await PrimaryContact.deleteMany({});
        // Seed test users
        const adminPass = await bcrypt.hash('admin123', 10);
        const agentPass = await bcrypt.hash('agent123', 10);
        const marketerPass = await bcrypt.hash('marketer123', 10);
        await User.create([
            {
                name: 'System Admin',
                email: 'admin@travel.com',
                passwordHash: adminPass,
                role: 'ADMIN',
                groups: ['Management']
            },
            {
                name: 'Demo Agent',
                email: 'agent@travel.com',
                passwordHash: agentPass,
                role: 'AGENT',
                groups: ['Sales']
            },
            {
                name: 'Demo Marketer',
                email: 'marketer@travel.com',
                passwordHash: marketerPass,
                role: 'MARKETER',
                groups: ['Marketing']
            }
        ]);
        console.log('✅ In-memory database seeded successfully!');
        // Do NOT disconnect from mongoose here. Let it reuse the connection globally.
        // Configure cluster to run server.ts for workers
        try {
            if (cluster_1.default.setupPrimary) {
                cluster_1.default.setupPrimary({
                    exec: path_1.default.resolve(__dirname, 'server.ts'),
                });
            }
            else if (cluster_1.default.setupMaster) {
                cluster_1.default.setupMaster({
                    exec: path_1.default.resolve(__dirname, 'server.ts'),
                });
            }
        }
        catch (e) {
            console.warn('Could not configure cluster exec target:', e);
        }
        // Now, start the backend server
        console.log('Starting the backend server...');
        require('./server');
    }
    start().catch(err => {
        console.error('Failed to start E2E backend runner:', err);
        process.exit(1);
    });
}
else {
    // Worker logic (just import server directly)
    require('./server');
}
