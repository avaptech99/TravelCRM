"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationAsRead = exports.getMyNotifications = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Notification_1 = __importDefault(require("../models/Notification"));
const cache_1 = __importDefault(require("../utils/cache"));
// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = `notifications_${req.user?.id}`;
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const notifications = await Notification_1.default.find({ userId: req.user?.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    const mappedNotifications = notifications.map(n => ({
        ...n,
        id: n._id.toString()
    }));
    cache_1.default.set(cacheKey, mappedNotifications, 30); // Cache for 30 seconds
    res.json(mappedNotifications);
});
// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = (0, express_async_handler_1.default)(async (req, res) => {
    const notification = await Notification_1.default.findById(req.params.id);
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
    cache_1.default.invalidateByPrefix(`notifications_${req.user?.id}`);
    res.json(notification);
});
