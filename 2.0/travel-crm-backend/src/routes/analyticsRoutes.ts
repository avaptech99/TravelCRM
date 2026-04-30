import express from 'express';
import { 
    getBookingAnalytics, 
    getPaymentAnalytics, 
    getRevenueTrends, 
    getAgentAnalytics,
    getPaymentBreakdown,
    getQueryGrouping
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
router.get('/payment-breakdown', getPaymentBreakdown);
router.get('/query-grouping', getQueryGrouping);

export default router;
