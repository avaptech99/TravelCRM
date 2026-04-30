import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from './config/db';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const seedDB = async () => {
    try {
        await connectDB();

        // Clear existing initial test data
        await User.deleteMany();

        // Admin Account Data
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        const adminUser = {
            name: 'System Admin',
            email: 'admin@travel.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        };

        // Agent Account Data
        const agentPasswordHash = await bcrypt.hash('agent123', 10);
        const agentUser = {
            name: 'Demo Agent',
            email: 'agent@travel.com',
            passwordHash: agentPasswordHash,
            role: 'AGENT',
        };

        await User.insertMany([adminUser, agentUser]);

        console.log('Database successfully seeded with Demo Admin & Agent accounts!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
