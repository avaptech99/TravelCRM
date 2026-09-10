"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFollowUpReminders = processFollowUpReminders;
exports.startFollowUpCron = startFollowUpCron;
const Booking_1 = __importDefault(require("../models/Booking"));
const Notification_1 = __importDefault(require("../models/Notification"));
const sseManager_1 = require("../sse/sseManager");
// followUpDate is stored as UTC-midnight of whatever calendar date the agent
// picked (new Date("2026-09-15") from a plain <input type="date">) -- it's a
// pure calendar day, not a real instant. "Today" must be compared using that
// same convention, sourced from Toronto's calendar date -- using the
// server's own local clock (Render runs in UTC) meant "today" could be off
// by a day for a few hours around midnight UTC (~8PM/7PM Toronto).
const CRM_TIMEZONE = 'America/Toronto';
function torontoTodayYMD() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: CRM_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return { year: get('year'), month: get('month'), day: get('day') };
}
/**
 * Check for bookings with "Follow Up" status where followUpDate is today or overdue.
 * Create a notification for the assigned agent (or creator if unassigned).
 * Runs once daily via setInterval in server.ts.
 */
async function processFollowUpReminders() {
    try {
        const { year, month, day } = torontoTodayYMD();
        // End of today (23:59:59), Toronto calendar date, UTC-midnight
        // convention to match how followUpDate itself is stored.
        const endOfToday = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
        // Find all bookings that are "Follow Up" with a followUpDate that has arrived
        const dueBookings = await Booking_1.default.find({
            status: 'Follow Up',
            followUpDate: { $lte: endOfToday, $ne: null },
        })
            .select('uniqueCode assignedToUserId createdByUserId contact')
            .lean();
        if (dueBookings.length === 0) {
            return;
        }
        console.log(`[FollowUp Cron] Found ${dueBookings.length} due follow-up(s).`);
        for (const booking of dueBookings) {
            const targetUserId = booking.assignedToUserId || booking.createdByUserId;
            if (!targetUserId)
                continue;
            const contactName = booking.contact?.name || 'Unknown Contact';
            // Check if we already sent a notification for this booking today
            const startOfToday = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
            const existingNotification = await Notification_1.default.findOne({
                bookingId: booking._id,
                userId: targetUserId,
                message: { $regex: /Follow-up reminder/i },
                createdAt: { $gte: startOfToday },
            });
            if (existingNotification)
                continue; // Already notified today
            const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const notification = await Notification_1.default.create({
                userId: targetUserId,
                bookingId: booking._id,
                message: `Follow-up reminder: ${contactName} — Booking ${booking.uniqueCode} is due for follow-up today.`,
                read: false,
                isDismissed: false,
                expireAt,
            });
            // Push SSE notification
            (0, sseManager_1.pushToUser)(String(targetUserId), 'notification_new', {
                _id: String(notification._id),
                message: notification.message,
                bookingId: String(notification.bookingId),
                createdAt: notification.createdAt,
                read: false,
            });
            // Log activity in Timeline
            const Timeline = (await Promise.resolve().then(() => __importStar(require('../models/Timeline')))).default;
            await Timeline.create({
                bookingId: booking._id,
                userId: targetUserId, // Attributing to the agent
                type: 'activity',
                action: 'FOLLOW_UP_REMINDER',
                details: `Automatic reminder sent for booking ${booking.uniqueCode}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            console.log(`[FollowUp Cron] Notified agent for booking ${booking.uniqueCode}`);
        }
    }
    catch (error) {
        console.error('[FollowUp Cron] Error processing follow-up reminders:', error);
    }
}
/**
 * Start the follow-up cron job. Runs every 1 hour to catch due follow-ups.
 */
function startFollowUpCron() {
    console.log('[FollowUp Cron] Started — checking every hour for due follow-ups.');
    // Run immediately once on startup
    processFollowUpReminders();
    // Then run every hour (3600000ms)
    setInterval(processFollowUpReminders, 60 * 60 * 1000);
}
