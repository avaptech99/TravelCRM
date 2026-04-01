import mongoose, { Document, Model, Schema } from 'mongoose';
import Counter from './Counter';

export interface IBooking extends Document {
    primaryContactId: mongoose.Types.ObjectId;
    uniqueCode: string;
    destination: string | null;
    travelDate: Date | null;
    returnDate: Date | null;
    flightFrom: string | null;
    flightTo: string | null;
    tripType: 'one-way' | 'round-trip' | 'multi-city';
    segments: {
        from: string;
        to: string;
        date: Date | null;
    }[];
    amount: number;
    totalAmount: number;
    finalQuotation: string | null;
    travellers: number | null;
    status: 'Pending' | 'Working' | 'Sent' | 'Booked';
    createdByUserId: mongoose.Types.ObjectId;
    assignedToUserId: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        primaryContactId: { type: Schema.Types.ObjectId, ref: 'PrimaryContact', required: true },
        uniqueCode: { type: String, unique: true },
        destination: { type: String, default: null },
        travelDate: { type: Date, default: null },
        returnDate: { type: Date, default: null },
        flightFrom: { type: String, default: null },
        flightTo: { type: String, default: null },
        tripType: { type: String, enum: ['one-way', 'round-trip', 'multi-city'], default: 'one-way' },
        segments: [{
            from: { type: String, default: null },
            to: { type: String, default: null },
            date: { type: Date, default: null },
        }],
        amount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        finalQuotation: { type: String, default: null },
        travellers: { type: Number, default: null },
        status: { type: String, enum: ['Pending', 'Working', 'Sent', 'Booked'], default: 'Pending' },
        createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

bookingSchema.pre('save', async function (this: any) {
    if (!this.uniqueCode) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                'bookingId',
                { $inc: { seq: 1 } },
                { returnDocument: 'after', upsert: true }
            );
            
            if (counter) {
                const seqStr = counter.seq.toString().padStart(4, '0');
                this.uniqueCode = `TW${seqStr}`;
            }
        } catch (error) {
            console.error('Error generating sequential uniqueCode:', error);
            this.uniqueCode = 'TW' + Math.floor(1000 + Math.random() * 9000).toString();
        }
    }
});

// Indexes to speed up queries
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ assignedToUserId: 1 });
bookingSchema.index({ createdByUserId: 1 });
bookingSchema.index({ primaryContactId: 1 });

// Virtual properties
bookingSchema.virtual('assignedToUser', {
    ref: 'User',
    localField: 'assignedToUserId',
    foreignField: '_id',
    justOne: true,
});

bookingSchema.virtual('createdByUser', {
    ref: 'User',
    localField: 'createdByUserId',
    foreignField: '_id',
    justOne: true,
});

bookingSchema.virtual('primaryContact', {
    ref: 'PrimaryContact',
    localField: 'primaryContactId',
    foreignField: '_id',
    justOne: true,
});

bookingSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'bookingId',
});

bookingSchema.virtual('payments', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'bookingId',
});

bookingSchema.virtual('passengers', {
    ref: 'Passenger',
    localField: '_id',
    foreignField: 'bookingId',
});

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
