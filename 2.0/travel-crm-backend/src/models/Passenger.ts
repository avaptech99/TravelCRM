import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPassenger extends Document {
    bookingId: mongoose.Types.ObjectId;
    name: string;
    countryCode: string;
    phoneNumber: string | null;
    email: string | null;
    dob: string | null;
    anniversary: string | null;
    country: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const passengerSchema = new Schema<IPassenger>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        name: { type: String, required: true },
        countryCode: { type: String, default: '+91' },
        phoneNumber: { type: String, default: null },
        email: { type: String, default: null },
        dob: { type: String, default: null },
        anniversary: { type: String, default: null },
        country: { type: String, default: null },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

passengerSchema.index({ bookingId: 1 });

const Passenger: Model<IPassenger> = mongoose.model<IPassenger>('Passenger', passengerSchema);

export default Passenger;
