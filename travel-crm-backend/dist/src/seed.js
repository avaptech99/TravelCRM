"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("./config/db"));
const User_1 = __importDefault(require("./models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedDB = async () => {
    try {
        await (0, db_1.default)();
        // Clear existing initial test data
        await User_1.default.deleteMany();
        // Admin Account Data
        const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 10);
        const adminUser = {
            name: 'System Admin',
            email: 'admin@travel.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        };
        // Agent Account Data
        const agentPasswordHash = await bcryptjs_1.default.hash('agent123', 10);
        const agentUser = {
            name: 'Demo Agent',
            email: 'agent@travel.com',
            passwordHash: agentPasswordHash,
            role: 'AGENT',
        };
        await User_1.default.insertMany([adminUser, agentUser]);
        console.log('Database successfully seeded with Demo Admin & Agent accounts!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};
seedDB();
