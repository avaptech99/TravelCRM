import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISegment extends Document {
    bookingId: mongoose.Types.ObjectId;
    legNumber: number;
    flightFrom: string | null;
    flightTo: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    returnDepartureTime: string | null;
    returnArrivalTime: string | null;
}

const segmentSchema = new Schema<ISegment>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        legNumber: { type: Number, required: true },
        flightFrom: { type: String, default: null },
        flightTo: { type: String, default: null },
        departureTime: { type: String, default: null },
        arrivalTime: { type: String, default: null },
        returnDepartureTime: { type: String, default: null },
        returnArrivalTime: { type: String, default: null },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound index — returns legs in order per booking
segmentSchema.index({ bookingId: 1, legNumber: 1 });

const Segment: Model<ISegment> = mongoose.model<ISegment>('Segment', segmentSchema);

export default Segment;
