"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get agents is protected (available to both Admin and Agents)
router.get('/agents', auth_1.protect, userController_1.getAgents);
// Heartbeat for online status
router.post('/heartbeat', auth_1.protect, userController_1.heartbeat);
// Goodbye signal — no auth (sendBeacon can't send headers)
router.post('/offline', userController_1.setOffline);
// Change password (available to all authenticated users)
router.put('/change-password', auth_1.protect, userController_1.changePassword);
// Update profile
router.put('/profile', auth_1.protect, userController_1.updateProfile);
// Get all users (Admin only)
router.get('/', auth_1.protect, auth_1.adminGuard, userController_1.getAllUsers);
// Create user (Admin only)
router.post('/', auth_1.protect, auth_1.adminGuard, userController_1.createUser);
// Unassign bookings for a specific user (Admin only)
router.post('/:id/unassign-bookings', auth_1.protect, auth_1.adminGuard, userController_1.unassignUserBookings);
// Delete user (Admin only)
router.delete('/:id', auth_1.protect, auth_1.adminGuard, userController_1.deleteUser);
// Update user (Admin only)
router.put('/:id', auth_1.protect, auth_1.adminGuard, userController_1.updateUserById);
// Update status
router.patch('/status', auth_1.protect, userController_1.updateStatus);
// Unassign offline bookings (Admin only)
router.post('/unassign-offline-bookings', auth_1.protect, auth_1.adminGuard, userController_1.unassignOfflineBookings);
exports.default = router;
