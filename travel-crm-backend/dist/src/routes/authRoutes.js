"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
router.post('/login', authController_1.loginUser);
// Temporary seed route for live database
router.get('/seed', async (req, res) => {
    try {
        await User_1.default.deleteMany();
        const adminPasswordHash = await bcrypt_1.default.hash('admin123', 10);
        const agentPasswordHash = await bcrypt_1.default.hash('agent123', 10);
        await User_1.default.insertMany([
            { name: 'System Admin', email: 'admin@travel.com', passwordHash: adminPasswordHash, role: 'ADMIN' },
            { name: 'Demo Agent', email: 'agent@travel.com', passwordHash: agentPasswordHash, role: 'AGENT' }
        ]);
        res.json({ message: 'Live Database Seeded Successfully!' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
