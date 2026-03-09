import express from 'express';
import { loginUser } from '../controllers/authController';

const router = express.Router();

import User from '../models/User';
import bcrypt from 'bcryptjs';

router.post('/login', loginUser);

// Temporary seed route for live database
router.get('/seed', async (req, res) => {
    try {
        await User.deleteMany();
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        const agentPasswordHash = await bcrypt.hash('agent123', 10);
        await User.insertMany([
            { name: 'System Admin', email: 'admin@travel.com', passwordHash: adminPasswordHash, role: 'ADMIN' },
            { name: 'Demo Agent', email: 'agent@travel.com', passwordHash: agentPasswordHash, role: 'AGENT' }
        ]);
        res.json({ message: 'Live Database Seeded Successfully!' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
