import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupplier extends Document {
    name: string;
    category: string;
    contactInfo: string | null;
    createdAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
    {
        name: { type: String, required: true },
        category: {
            type: String,
            enum: ['Air Ticket', 'Hotel', 'Visa', 'Insurance', 'Ground Handling', 'Sightseeing'],
            required: true,
        },
        contactInfo: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound index — dropdown query: "all Air Ticket suppliers" sorted alphabetically
supplierSchema.index({ category: 1, name: 1 });

const Supplier: Model<ISupplier> = mongoose.model<ISupplier>('Supplier', supplierSchema);

export default Supplier;
