import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    bookingId?: mongoose.Types.ObjectId;
    message: string;
    read: boolean;
    isDismissed: boolean;
    createdAt: Date;
}

const notificationSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
        },
        message: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        isDismissed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 }); // Covers sync dashboard query
notificationSchema.index({ bookingId: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
