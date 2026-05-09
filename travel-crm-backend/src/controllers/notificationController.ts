import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification';
import { CK, TTL, CacheInvalidation, cacheGet, cacheSet } from '../utils/cache';
import { createTimer } from '../utils/perfLogger';

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

    const cacheKey = CK.notifications(userId);
    
    const t = createTimer(`getNotifications_${userId}`);
    t.mark('checkCache');

    // 1. Cache hit — fastest path
    const cached = cacheGet<any[]>(cacheKey);
    if (cached !== null) {
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache', userId });
        res.json(cached);
        return;
    }

    // 2. In-flight dedup — multiple users/requests wait for the same DB query
    if (notifInFlight.has(cacheKey)) {
        t.mark('waitDeduplicated');
        const data = await notifInFlight.get(cacheKey);
        res.setHeader('X-Cache-Status', 'DEDUPLICATED');
        t.end({ source: 'deduplicated', userId });
        res.json(data || []);
        return;
    }

    // 3. First request — create the promise and share it
    const fetchPromise = (async () => {
        t.mark('dbQuery');
        // Filter by isDismissed: false to use our compound index effectively
        const notifications = await Notification.find({ userId, isDismissed: false })
            .sort({ createdAt: -1 })
            .limit(20) 
            .lean()
            .maxTimeMS(2000);

        t.mark('formatResponse');
        const mapped = notifications.map(n => ({
            ...n,
            id: n._id.toString()
        }));

        cacheSet(cacheKey, mapped, TTL.NOTIFICATIONS); // 60s not 300s
        return mapped;
    })();

    notifInFlight.set(cacheKey, fetchPromise);

    try {
        const result = await fetchPromise;
        res.setHeader('X-Cache-Status', 'MISS');
        t.end({ source: 'db', userId, count: result.length });
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
    CacheInvalidation.onNotificationWrite(req.user!.id);
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

    CacheInvalidation.onNotificationWrite(req.user!.id);
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

    CacheInvalidation.onNotificationWrite(req.user!.id);
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

    CacheInvalidation.onNotificationWrite(req.user!.id);
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

    CacheInvalidation.onNotificationWrite(req.user!.id);
    res.json({ message: 'Notification deleted permanently' });
});
