import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IComment extends Document {
    bookingId: mongoose.Types.ObjectId;
    createdById: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for createdBy (mirroring Prisma format)
commentSchema.index({ bookingId: 1 });
commentSchema.index({ createdById: 1 });
commentSchema.virtual('createdBy', {
    ref: 'User',
    localField: 'createdById',
    foreignField: '_id',
    justOne: true,
});

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
