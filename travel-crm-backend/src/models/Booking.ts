import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBooking extends Document {
    createdOn: Date;
    createdByUserId: mongoose.Types.ObjectId | null;
    contactPerson: string;
    contactNumber: string;
    requirements: string | null;
    assignedToUserId: mongoose.Types.ObjectId | null;
    status: string;
    isConvertedToEDT: boolean;
    pricePerTicket?: number;
    totalAmount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        createdOn: { type: Date, default: Date.now },
        createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        contactPerson: { type: String, required: true },
        contactNumber: { type: String, required: true },
        requirements: { type: String, default: null },
        assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        status: { type: String, default: 'Pending' },
        isConvertedToEDT: { type: Boolean, default: false },
        pricePerTicket: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes to speed up queries
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ assignedToUserId: 1 });

// Virtual properties to mirror Prisma include logic
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

bookingSchema.virtual('travelers', {
    ref: 'Traveler',
    localField: '_id',
    foreignField: 'bookingId',
});

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
