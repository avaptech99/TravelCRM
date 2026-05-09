import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
    bookingId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    text: string;
    type: 'comment' | 'activity';
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['comment', 'activity'], default: 'comment', index: true },
}, { 
    timestamps: true,
    collection: 'comments' // Points to the unified collection
});

commentSchema.index({ bookingId: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
