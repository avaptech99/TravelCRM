"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.getAuthToken = exports.testMarketerId = exports.testAgentId = exports.testAdminId = void 0;
process.env.JWT_SECRET = 'super-secret-jwt-key-for-travel-crm';
process.env.PORT = '5001';
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Booking_1 = __importDefault(require("../models/Booking"));
// Dynamically add participantIds to the schema since it's missing in the source Booking.ts model file
Booking_1.default.schema.add({
    participantIds: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }]
});
let mongoServer;
beforeAll(async () => {
    jest.setTimeout(30000);
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose_1.default.connect(uri);
});
afterAll(async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
beforeEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    // Seed test users with valid bcrypt hashed passwords
    const adminPass = await bcrypt_1.default.hash('testpass123', 10);
    const agentPass = await bcrypt_1.default.hash('agentpass123', 10);
    const marketerPass = await bcrypt_1.default.hash('marketerpass123', 10);
    const admin = await User_1.default.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: adminPass,
        role: 'ADMIN',
        groups: ['Management']
    });
    const agent = await User_1.default.create({
        name: 'Agent User',
        email: 'agent@test.com',
        passwordHash: agentPass,
        role: 'AGENT',
        groups: ['Sales']
    });
    const marketer = await User_1.default.create({
        name: 'Marketer User',
        email: 'marketer@test.com',
        passwordHash: marketerPass,
        role: 'MARKETER',
        groups: ['Marketing']
    });
    exports.testAdminId = admin._id.toString();
    exports.testAgentId = agent._id.toString();
    exports.testMarketerId = marketer._id.toString();
});
const getAuthToken = (role = 'ADMIN') => {
    let id = exports.testAdminId;
    let email = 'admin@test.com';
    let name = 'Admin User';
    let groups = ['Management'];
    if (role === 'AGENT') {
        id = exports.testAgentId;
        email = 'agent@test.com';
        name = 'Agent User';
        groups = ['Sales'];
    }
    else if (role === 'MARKETER') {
        id = exports.testMarketerId;
        email = 'marketer@test.com';
        name = 'Marketer User';
        groups = ['Marketing'];
    }
    return jsonwebtoken_1.default.sign({ id, name, email, role, groups }, process.env.JWT_SECRET || 'super-secret-jwt-key-for-travel-crm', { expiresIn: '1h' });
};
exports.getAuthToken = getAuthToken;
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: err.stack,
    });
};
exports.errorHandler = errorHandler;
