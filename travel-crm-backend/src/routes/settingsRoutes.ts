import express from 'express';
import { getDropdowns, updateDropdown } from '../controllers/settingsController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

// Dropdown routes
router.get('/dropdowns', protect, getDropdowns);
router.put('/dropdowns/:key', protect, adminGuard, updateDropdown);

export default router;
