import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITraveler extends Document {
    bookingId: mongoose.Types.ObjectId;
    name: string;
    phoneNumber: string | null;
    email: string | null;
    country: string | null;
    flightFrom: string | null;
    flightTo: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    tripType: string | null;
    returnDate: string | null;
    returnDepartureTime: string | null;
    returnArrivalTime: string | null;
    dob: string | null;
    anniversary: string | null;
    isPrimary: boolean;
}

const travelerSchema = new Schema<ITraveler>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        name: { type: String, required: true },
        phoneNumber: { type: String, default: null },
        email: { type: String, default: null },
        country: { type: String, default: null },
        flightFrom: { type: String, default: null },
        flightTo: { type: String, default: null },
        departureTime: { type: String, default: null },
        arrivalTime: { type: String, default: null },
        tripType: { type: String, default: null },
        returnDate: { type: String, default: null },
        returnDepartureTime: { type: String, default: null },
        returnArrivalTime: { type: String, default: null },
        dob: { type: String, default: null },
        anniversary: { type: String, default: null },
        isPrimary: { type: Boolean, default: false },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

travelerSchema.index({ bookingId: 1 });

const Traveler: Model<ITraveler> = mongoose.model<ITraveler>('Traveler', travelerSchema);

export default Traveler;
