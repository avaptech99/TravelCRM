import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayment extends Document {
    bookingId: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    remarks?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, required: true },
        transactionId: { type: String, default: null },
        remarks: { type: String, default: null },
        date: { type: Date, default: Date.now, required: true },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ date: -1 });

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
