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
router.route('/:id/travelers')
    .post(bookingController_1.addTravelers)
    .put(bookingController_1.updateTravelers);
router.route('/:id/payments')
    .get(bookingController_1.getPayments)
    .post(bookingController_1.addPayment);
router.route('/:id/payments/:paymentId')
    .delete(bookingController_1.deletePayment);
exports.default = router;
