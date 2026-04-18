import mongoose, { Document, Schema } from 'mongoose';

export interface IMissedCall extends Document {
    callerNumber: string;
    callerName: string;
    calledNumber: string;
    callTime: Date;
    endTime: Date | null;
    duration: number;
    billsec: number;
    disposition: string;
    uniqueId: string;
    channel: string;
    userfield: string;
    rawPayload: any;
    isReviewed: boolean;
    isProcessed: boolean;
    createdAt: Date;
}

const missedCallSchema: Schema = new Schema(
    {
        callerNumber: {
            type: String,
            required: true,
        },
        callerName: {
            type: String,
            default: '',
        },
        calledNumber: {
            type: String,
            required: true,
        },
        callTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            default: null,
        },
        duration: {
            type: Number,
            default: 0,
        },
        billsec: {
            type: Number,
            default: 0,
        },
        disposition: {
            type: String,
            required: true,
        },
        uniqueId: {
            type: String,
            required: true,
            unique: true,
        },
        channel: {
            type: String,
            default: '',
        },
        userfield: {
            type: String,
            default: '',
        },
        rawPayload: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isReviewed: {
            type: Boolean,
            default: false,
        },
        isProcessed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

missedCallSchema.index({ callTime: -1 });
missedCallSchema.index({ callerNumber: 1 });
missedCallSchema.index({ isReviewed: 1 });
missedCallSchema.index({ disposition: 1 });

export default mongoose.model<IMissedCall>('MissedCall', missedCallSchema);
