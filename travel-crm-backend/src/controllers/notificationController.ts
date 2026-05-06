import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification';
import appCache from '../utils/cache';

// Module-level map to track in-flight notification requests
const notifInFlight = new Map<string, Promise<any>>();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const cacheKey = `notifications_${userId}`;
    
    // 1. Cache hit — fastest path
    const cached = appCache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    // 2. In-flight dedup — multiple users/requests wait for the same DB query
    if (notifInFlight.has(cacheKey)) {
        console.log(`[DEDUPLICATED] Notification request for ${userId} joined in-flight promise`);
        const data = await notifInFlight.get(cacheKey);
        res.json(data || []);
        return;
    }

    // 3. First request — create the promise and share it
    const fetchPromise = (async () => {
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50) // increased from 20 for better user experience
            .lean();

        const mapped = notifications.map(n => ({
            ...n,
            id: n._id.toString()
        }));

        appCache.set(cacheKey, mapped, 60); // Reduced to 1 minute for better real-time feel under single-flight
        return mapped;
    })();

    notifInFlight.set(cacheKey, fetchPromise);

    try {
        const result = await fetchPromise;
        res.json(result);
    } finally {
        notifInFlight.delete(cacheKey); // Always clean up
    }
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

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany(
        { userId: req.user?.id, read: false },
        { $set: { read: true } }
    );

    appCache.invalidateByPrefix(`notifications_${req.user?.id}`);
    appCache.invalidateByPrefix(`sync_${req.user?.id}`);
    res.json({ message: 'All notifications marked as read' });
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
