"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All booking routes are protected
router.use(auth_1.protect);
// Lightweight endpoints (MUST come before /:id)
router.get('/stats', bookingController_1.getBookingStats);
router.get('/recent', bookingController_1.getRecentBookings);
router.get('/calendar', bookingController_1.getCalendarBookings);
router.post('/bulk-assign', auth_1.adminGuard, bookingController_1.bulkAssign);
router.post('/bulk-delete', auth_1.adminGuard, bookingController_1.bulkDelete);
router.route('/')
    .get(bookingController_1.getBookings)
    .post(bookingController_1.createBooking);
router.route('/:id')
    .get(bookingController_1.getBookingById)
    .put(bookingController_1.updateBooking)
    .delete(bookingController_1.deleteBooking);
router.route('/:id/status')
    .patch(bookingController_1.updateBookingStatus);
router.route('/:id/assign')
    .patch(bookingController_1.assignBooking);
router.route('/:id/comments')
    .get(bookingController_1.getComments)
    .post(bookingController_1.addComment);
router.route('/:id/passengers')
    .post(bookingController_1.addPassengers)
    .put(bookingController_1.updatePassengers);
router.get('/:id/activity', bookingController_1.getBookingActivity);
router.patch('/:id/verify', bookingController_1.verifyBooking);
router.route('/:id/payments')
    .get(bookingController_1.getPayments)
    .post(bookingController_1.addPayment);
router.route('/:id/payments/:paymentId')
    .delete(bookingController_1.deletePayment);
exports.default = router;
