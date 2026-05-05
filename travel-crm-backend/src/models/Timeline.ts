import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeline extends Document {
    bookingId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'comment' | 'activity';
    text?: string;
    action?: string;
    details?: string;
    expireAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const timelineSchema = new Schema<ITimeline>({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['comment', 'activity'], required: true },
    text: { type: String },
    action: { type: String },
    details: { type: String },
    expireAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { 
    timestamps: true 
});

// Compound index for efficient fetching
timelineSchema.index({ bookingId: 1, type: 1, createdAt: -1 });

const Timeline = mongoose.model<ITimeline>('Timeline', timelineSchema);

export default Timeline;
