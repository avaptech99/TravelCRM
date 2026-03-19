import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPrimaryContact extends Document {
    contactName: string;
    contactPhoneNo: string;
    bookingType: 'Agent (B2B)' | 'Direct (B2C)';
    requirements: string | null;
    interested: string;
}

const primaryContactSchema = new Schema<IPrimaryContact>(
    {
        contactName: { type: String, required: true },
        contactPhoneNo: { type: String, required: true },
        bookingType: { type: String, enum: ['Agent (B2B)', 'Direct (B2C)'], required: true, default: 'Direct (B2C)' },
        requirements: { type: String, default: null },
        interested: { type: String, enum: ['Yes', 'No'], default: 'No' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

primaryContactSchema.index({ contactName: 1 });
primaryContactSchema.index({ contactPhoneNo: 1 });

const PrimaryContact: Model<IPrimaryContact> = mongoose.model<IPrimaryContact>('PrimaryContact', primaryContactSchema);

export default PrimaryContact;
