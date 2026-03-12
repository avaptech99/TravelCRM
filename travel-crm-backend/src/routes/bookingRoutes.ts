import express from 'express';
import {
    getBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    assignBooking,
    addComment,
    getComments,
    addTravelers,
    deleteBooking,
    updateBooking,
    updateTravelers,
    addPayment,
    getPayments,
    deletePayment,
    getBookingStats,
    getRecentBookings,
} from '../controllers/bookingController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

// All booking routes are protected
router.use(protect);

// Lightweight endpoints (MUST come before /:id)
router.get('/stats', getBookingStats);
router.get('/recent', getRecentBookings);

router.route('/')
    .get(getBookings)
    .post(createBooking);

router.route('/:id')
    .get(getBookingById)
    .put(updateBooking)
    .delete(deleteBooking);

router.route('/:id/status')
    .patch(updateBookingStatus);

router.route('/:id/assign')
    .patch(assignBooking);

router.route('/:id/comments')
    .get(getComments)
    .post(addComment);

router.route('/:id/travelers')
    .post(addTravelers)
    .put(updateTravelers);

router.route('/:id/payments')
    .get(getPayments)
    .post(addPayment);

router.route('/:id/payments/:paymentId')
    .delete(deletePayment);

export default router;
