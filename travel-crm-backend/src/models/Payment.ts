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
paymentSchema.index({ updatedAt: -1 });

// Pre-find hook to start timer
paymentSchema.pre(/^find/, function (next) {
    (this as any)._queryStart = Date.now();
    next();
});

// Post-find hook to log slow queries
paymentSchema.post(/^find/, function (docs, next) {
    const duration = Date.now() - (this as any)._queryStart;
    if (duration > 100) {
        console.log(`[MONGOOSE SLOW] Payment.${(this as any).op} — ${duration}ms | filter: ${JSON.stringify((this as any)._conditions)}`);
    }
    next();
});

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
