"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All analytics routes are protected and admin-only
router.use(auth_1.protect);
router.use(auth_1.adminGuard);
router.get('/bookings', analyticsController_1.getBookingAnalytics);
router.get('/payments', analyticsController_1.getPaymentAnalytics);
router.get('/revenue-trends', analyticsController_1.getRevenueTrends);
router.get('/agents', analyticsController_1.getAgentAnalytics);
router.get('/payment-breakdown', analyticsController_1.getPaymentBreakdown);
router.get('/query-grouping', analyticsController_1.getQueryGrouping);
exports.default = router;
