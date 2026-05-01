import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICost extends Document {
    bookingId: mongoose.Types.ObjectId;
    costType: string;
    price: number;
    supplierId: mongoose.Types.ObjectId | null;
    costKind: 'estimated' | 'actual';
    createdAt: Date;
}

const costSchema = new Schema<ICost>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        costType: {
            type: String,
            enum: ['Air Ticket', 'Hotel', 'Visa', 'Insurance', 'Ground Handling', 'Sightseeing'],
            required: true,
        },
        price: { type: Number, required: true, default: 0 },
        supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
        costKind: {
            type: String,
            enum: ['estimated', 'actual'],
            required: true,
        },
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound index — filter by booking + cost kind for margin calculations
costSchema.index({ bookingId: 1, costKind: 1 });

const Cost: Model<ICost> = mongoose.model<ICost>('Cost', costSchema);

export default Cost;
