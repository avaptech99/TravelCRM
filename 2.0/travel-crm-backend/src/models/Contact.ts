import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IContact extends Document {
    contactName: string;
    contactPhoneNo: string;
    contactEmail: string | null;
    bookingType: 'Direct (B2C)' | 'Agent (B2B)';
    requirements: string | null;
    assignedGroup: string | null;
    status: 'Pending' | 'Working' | 'Sent' | 'Booked' | 'Follow up';
    interested: 'Yes' | 'No' | null;
    assignedToUserId: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
    {
        contactName: { type: String, required: true },
        contactPhoneNo: { type: String, required: true },
        contactEmail: { type: String, default: null },
        bookingType: {
            type: String,
            enum: ['Direct (B2C)', 'Agent (B2B)'],
            required: true,
            default: 'Direct (B2C)',
        },
        requirements: { type: String, default: null },
        assignedGroup: { type: String, default: null },
        status: {
            type: String,
            enum: ['Pending', 'Working', 'Sent', 'Booked', 'Follow up'],
            default: 'Pending',
        },
        interested: {
            type: String,
            enum: ['Yes', 'No'],
            default: null,
        },
        assignedToUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
contactSchema.index({ contactPhoneNo: 1 });
contactSchema.index({ status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 });
contactSchema.index({ assignedToUserId: 1, createdAt: -1 });
contactSchema.index({ createdAt: -1 });

const Contact: Model<IContact> = mongoose.model<IContact>('Contact', contactSchema);

export default Contact;
