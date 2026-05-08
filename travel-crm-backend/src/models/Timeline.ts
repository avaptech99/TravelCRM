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
    timestamps: true,
    collection: 'activities' // Ensure it matches legacy collection name
});

// Compound index for efficient fetching
timelineSchema.index({ bookingId: 1, createdAt: -1 });
timelineSchema.index({ bookingId: 1, type: 1, createdAt: -1 });

// Pre-find hook to start timer
timelineSchema.pre(/^find/, function () {
    (this as any)._queryStart = Date.now();
});

// Post-find hook to log slow queries
timelineSchema.post(/^find/, function () {
    const duration = Date.now() - (this as any)._queryStart;
    if (duration > 100) {
        console.log(`[MONGOOSE SLOW] Timeline.${(this as any).op} - ${duration}ms | filter: ${JSON.stringify((this as any)._conditions)}`);
    }
});

const Timeline = mongoose.model<ITimeline>('Timeline', timelineSchema);

export default Timeline;
