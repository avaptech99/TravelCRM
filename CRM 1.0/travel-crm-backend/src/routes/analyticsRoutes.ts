import express from 'express';
import { 
    getBookingAnalytics, 
    getPaymentAnalytics, 
    getRevenueTrends, 
    getAgentAnalytics 
} from '../controllers/analyticsController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

// All analytics routes are protected and admin-only
router.use(protect);
router.use(adminGuard);

router.get('/bookings', getBookingAnalytics);
router.get('/payments', getPaymentAnalytics);
router.get('/revenue-trends', getRevenueTrends);
router.get('/agents', getAgentAnalytics);

export default router;
