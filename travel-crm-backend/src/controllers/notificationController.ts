import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await Notification.find({ userId: req.user?.id })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user?.id) {
        res.status(401);
        throw new Error('Not authorized to update this notification');
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
});
