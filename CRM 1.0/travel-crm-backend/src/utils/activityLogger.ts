import Activity from '../models/Activity';

export const logActivity = async (bookingId: any, userId: any, action: string, details?: string) => {
    try {
        await Activity.create({
            bookingId,
            userId,
            action,
            details,
        });
        console.log(`[ACTIVITY LOG] ${action} for booking ${bookingId}`);
    } catch (error) {
        console.error(`[ACTIVITY LOG ERROR] ${error}`);
    }
};
