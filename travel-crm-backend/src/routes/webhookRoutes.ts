import express from 'express';
import { receiveMissedCall, getMissedCalls, toggleReviewed } from '../controllers/webhookController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public: GDMS webhook (protected by HTTP Basic Auth inside the controller)
router.post('/missed-call', receiveMissedCall);

// Protected: Frontend API (requires JWT)
router.get('/missed-calls', protect, getMissedCalls);
router.patch('/missed-calls/:id/review', protect, toggleReviewed);

export default router;
