import mongoose, { Document, Model, Schema } from 'mongoose';
import Counter from './Counter';

export interface IBooking extends Document {
    contactId: mongoose.Types.ObjectId;
    uniqueCode: string;
    finalQuotation: string | null;
    companyName: string | null;
    includesFlight: boolean;
    includesAdditionalServices: boolean;
    additionalServicesDetails: string | null;
    tripType: 'one-way' | 'round-trip' | 'multi-city' | null;
    lumpSumAmount: number;
    estimatedMargin: number;
    netMargin: number;
    outstanding: number;
    verified: boolean;
    verifiedBy: mongoose.Types.ObjectId | null;
    assignedToUserId: mongoose.Types.ObjectId | null;
    createdByUserId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
        uniqueCode: { type: String },
        finalQuotation: { type: String, default: null },
        companyName: { type: String, default: null },
        includesFlight: { type: Boolean, default: true },
        includesAdditionalServices: { type: Boolean, default: false },
        additionalServicesDetails: { type: String, default: null },
        tripType: { type: String, enum: ['one-way', 'round-trip', 'multi-city'], default: 'one-way' },
        lumpSumAmount: { type: Number, default: 0 },
        estimatedMargin: { type: Number, default: 0 },
        netMargin: { type: Number, default: 0 },
        outstanding: { type: Number, default: 0 },
        verified: { type: Boolean, default: false },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
        toJSON: { 
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id;
                // Flatten contact fields
                if (ret.contact) {
                    ret.contactPerson = ret.contact.contactName;
                    ret.contactNumber = ret.contact.contactPhoneNo;
                    ret.contactEmail = ret.contact.contactEmail;
                    ret.requirements = ret.contact.requirements;
                    ret.interested = ret.contact.interested || 'No';
                    ret.assignedGroup = ret.contact.assignedGroup || '';
                }
                return ret;
            }
        },
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

// Indexes
bookingSchema.index({ uniqueCode: 1 }, { unique: true });
bookingSchema.index({ contactId: 1, createdAt: -1 });
bookingSchema.index({ assignedToUserId: 1, createdAt: -1 });
bookingSchema.index({ verified: 1, createdAt: -1 });

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

bookingSchema.virtual('contact', {
    ref: 'Contact',
    localField: 'contactId',
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

bookingSchema.virtual('segments', {
    ref: 'Segment',
    localField: '_id',
    foreignField: 'bookingId',
});

bookingSchema.virtual('costs', {
    ref: 'Cost',
    localField: '_id',
    foreignField: 'bookingId',
});

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
