process.env.JWT_SECRET = 'super-secret-jwt-key-for-travel-crm';
process.env.PORT = '5001';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking';

// Dynamically add participantIds to the schema since it's missing in the source Booking.ts model file
Booking.schema.add({
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

let mongoServer: MongoMemoryServer;

export let testAdminId: string;
export let testAgentId: string;
export let testMarketerId: string;

beforeAll(async () => {
    jest.setTimeout(30000);
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }

    // Seed test users with valid bcrypt hashed passwords
    const adminPass = await bcrypt.hash('testpass123', 10);
    const agentPass = await bcrypt.hash('agentpass123', 10);
    const marketerPass = await bcrypt.hash('marketerpass123', 10);

    const admin = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: adminPass,
        role: 'ADMIN',
        groups: ['Management']
    });

    const agent = await User.create({
        name: 'Agent User',
        email: 'agent@test.com',
        passwordHash: agentPass,
        role: 'AGENT',
        groups: ['Sales']
    });
    
    const marketer = await User.create({
        name: 'Marketer User',
        email: 'marketer@test.com',
        passwordHash: marketerPass,
        role: 'MARKETER',
        groups: ['Marketing']
    });

    testAdminId = admin._id.toString();
    testAgentId = agent._id.toString();
    testMarketerId = marketer._id.toString();
});

export const getAuthToken = (role: 'ADMIN' | 'AGENT' | 'MARKETER' = 'ADMIN') => {
    let id = testAdminId;
    let email = 'admin@test.com';
    let name = 'Admin User';
    let groups = ['Management'];
    
    if (role === 'AGENT') {
        id = testAgentId;
        email = 'agent@test.com';
        name = 'Agent User';
        groups = ['Sales'];
    } else if (role === 'MARKETER') {
        id = testMarketerId;
        email = 'marketer@test.com';
        name = 'Marketer User';
        groups = ['Marketing'];
    }

    return jwt.sign(
        { id, name, email, role, groups },
        process.env.JWT_SECRET || 'super-secret-jwt-key-for-travel-crm',
        { expiresIn: '1h' }
    );
};

export const errorHandler = (err: any, req: any, res: any, next: any) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: err.stack,
    });
};
