import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IComment extends Document {
    bookingId: mongoose.Types.ObjectId | null;
    contactId: mongoose.Types.ObjectId | null;
    createdById: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: false, default: null },
        contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: false, default: null },
        createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes — dual path: booking activity feed + contact timeline
commentSchema.index({ bookingId: 1, createdAt: -1 });
commentSchema.index({ contactId: 1, createdAt: -1 });
commentSchema.index({ createdById: 1 });

commentSchema.virtual('createdBy', {
    ref: 'User',
    localField: 'createdById',
    foreignField: '_id',
    justOne: true,
});

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
