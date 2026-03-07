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
} from '../controllers/bookingController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

// All booking routes are protected
router.use(protect);

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
    .patch(adminGuard, assignBooking);

router.route('/:id/comments')
    .get(getComments)
    .post(addComment);

router.route('/:id/travelers')
    .post(addTravelers)
    .put(updateTravelers);

export default router;
