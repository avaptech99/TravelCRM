import express from 'express';
import { getAgents, getAllUsers, createUser, deleteUser, changePassword, updateProfile } from '../controllers/userController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

// Get agents is protected (available to both Admin and Agents)
router.get('/agents', protect, getAgents);

// Change password (available to all authenticated users)
router.put('/change-password', protect, changePassword);

// Update profile
router.put('/profile', protect, updateProfile);

// Get all users (Admin only)
router.get('/', protect, adminGuard, getAllUsers);

// Create user (Admin only)
router.post('/', protect, adminGuard, createUser);

// Delete user (Admin only)
router.delete('/:id', protect, adminGuard, deleteUser);

export default router;
