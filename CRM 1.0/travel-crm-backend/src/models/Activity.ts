import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
    bookingId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    action: string;
    details?: string;
    createdAt: Date;
}

const activitySchema: Schema = new Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        action: {
            type: String, // e.g., 'STATUS_CHANGE', 'ASSIGNED', 'TRAVELER_ADDED'
            required: true,
        },
        details: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

activitySchema.index({ bookingId: 1, createdAt: -1 });

export default mongoose.model<IActivity>('Activity', activitySchema);
