import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification';
import appCache from '../utils/cache';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `notifications_${req.user?.id}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const notifications = await Notification.find({ userId: req.user?.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    const mappedNotifications = notifications.map(n => ({
        ...n,
        id: n._id.toString()
    }));

    appCache.set(cacheKey, mappedNotifications, 30); // Cache for 30 seconds
    res.json(mappedNotifications);
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

    // Invalidate this user's notification cache
    appCache.invalidateByPrefix(`notifications_${req.user?.id}`);
    appCache.invalidateByPrefix(`sync_${req.user?.id}`);
    res.json(notification);
});

// @desc    Dismiss a notification (hide from bell icon, keep in dashboard logs)
// @route   PUT /api/notifications/:id/dismiss
// @access  Private
export const dismissNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user?.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    notification.isDismissed = true;
    notification.read = true;
    await notification.save();

    appCache.invalidateByPrefix(`notifications_${req.user?.id}`);
    appCache.invalidateByPrefix(`sync_${req.user?.id}`);
    res.json({ message: 'Notification dismissed' });
});

// @desc    Dismiss all notifications (hide all from bell icon)
// @route   PUT /api/notifications/dismiss-all
// @access  Private
export const dismissAllNotifications = asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany(
        { userId: req.user?.id },
        { $set: { isDismissed: true, read: true } }
    );

    appCache.invalidateByPrefix(`notifications_${req.user?.id}`);
    appCache.invalidateByPrefix(`sync_${req.user?.id}`);
    res.json({ message: 'All notifications dismissed' });
});

// @desc    Permanently delete a notification (removes from everywhere)
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user?.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await notification.deleteOne();

    appCache.invalidateByPrefix(`notifications_${req.user?.id}`);
    appCache.invalidateByPrefix(`sync_${req.user?.id}`);
    res.json({ message: 'Notification deleted permanently' });
});
