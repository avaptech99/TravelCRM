import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPassenger extends Document {
    bookingId: mongoose.Types.ObjectId;
    name: string;
    phoneNumber: string | null;
    email: string | null;
    dob: string | null;
    anniversary: string | null;
    country: string | null;
    flightFrom: string | null;
    flightTo: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    tripType: string | null;
    returnDate: string | null;
    returnDepartureTime: string | null;
    returnArrivalTime: string | null;
}

const passengerSchema = new Schema<IPassenger>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        name: { type: String, required: true },
        phoneNumber: { type: String, default: null },
        email: { type: String, default: null },
        dob: { type: String, default: null },
        anniversary: { type: String, default: null },
        country: { type: String, default: null },
        flightFrom: { type: String, default: null },
        flightTo: { type: String, default: null },
        departureTime: { type: String, default: null },
        arrivalTime: { type: String, default: null },
        tripType: { type: String, default: 'one-way' },
        returnDate: { type: String, default: null },
        returnDepartureTime: { type: String, default: null },
        returnArrivalTime: { type: String, default: null },
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
