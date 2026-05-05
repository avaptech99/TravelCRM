import Booking from '../models/Booking';
import Notification from '../models/Notification';

/**
 * Check for bookings with "Follow Up" status where followUpDate is today or overdue.
 * Create a notification for the assigned agent (or creator if unassigned).
 * Runs once daily via setInterval in server.ts.
 */
export async function processFollowUpReminders(): Promise<void> {
    try {
        const now = new Date();
        // End of today (23:59:59)
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        // Find all bookings that are "Follow Up" with a followUpDate that has arrived
        const dueBookings = await Booking.find({
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
            if (!targetUserId) continue;

            const contactName = (booking as any).contact?.name || 'Unknown Contact';

            // Check if we already sent a notification for this booking today
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const existingNotification = await Notification.findOne({
                bookingId: (booking as any)._id,
                userId: targetUserId,
                message: { $regex: /Follow-up reminder/i },
                createdAt: { $gte: startOfToday },
            });

            if (existingNotification) continue; // Already notified today

            const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            await Notification.create({
                userId: targetUserId,
                bookingId: (booking as any)._id,
                message: `Follow-up reminder: ${contactName} — Booking ${(booking as any).uniqueCode} is due for follow-up today.`,
                read: false,
                isDismissed: false,
                expireAt,
            });

            // Log activity in Timeline
            const Timeline = (await import('../models/Timeline')).default;
            await Timeline.create({
                bookingId: (booking as any)._id,
                userId: targetUserId, // Attributing to the agent
                type: 'activity',
                action: 'FOLLOW_UP_REMINDER',
                details: `Automatic reminder sent for booking ${(booking as any).uniqueCode}`,
                expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });

            console.log(`[FollowUp Cron] Notified agent for booking ${(booking as any).uniqueCode}`);
        }
    } catch (error) {
        console.error('[FollowUp Cron] Error processing follow-up reminders:', error);
    }
}

/**
 * Start the follow-up cron job. Runs every 1 hour to catch due follow-ups.
 */
export function startFollowUpCron(): void {
    console.log('[FollowUp Cron] Started — checking every hour for due follow-ups.');
    // Run immediately once on startup
    processFollowUpReminders();
    // Then run every hour (3600000ms)
    setInterval(processFollowUpReminders, 60 * 60 * 1000);
}
