import express from 'express';
import { getAgents, getAllUsers, createUser, deleteUser, changePassword, updateProfile, updateUserById, updateStatus, unassignOfflineBookings, unassignUserBookings, heartbeat, setOffline } from '../controllers/userController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

// Get agents is protected (available to both Admin and Agents)
router.get('/agents', protect, getAgents);

// Heartbeat for online status
router.post('/heartbeat', protect, heartbeat);

// Goodbye signal — no auth (sendBeacon can't send headers)
router.post('/offline', setOffline);

// Change password (available to all authenticated users)
router.put('/change-password', protect, changePassword);

// Update profile
router.put('/profile', protect, updateProfile);

// Get all users (Admin only)
router.get('/', protect, adminGuard, getAllUsers);

// Create user (Admin only)
router.post('/', protect, adminGuard, createUser);

// Unassign bookings for a specific user (Admin only)
router.post('/:id/unassign-bookings', protect, adminGuard, unassignUserBookings);

// Delete user (Admin only)
router.delete('/:id', protect, adminGuard, deleteUser);

// Update user (Admin only)
router.put('/:id', protect, adminGuard, updateUserById);

// Update status
router.patch('/status', protect, updateStatus);

// Unassign offline bookings (Admin only)
router.post('/unassign-offline-bookings', protect, adminGuard, unassignOfflineBookings);

// Create user (Admin only)
router.post('/', protect, adminGuard, createUser);

// Delete user (Admin only)
router.delete('/:id', protect, adminGuard, deleteUser);

export default router;
