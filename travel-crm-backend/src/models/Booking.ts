import mongoose, { Document, Model, Schema } from 'mongoose';
import Counter from './Counter';

export interface IBooking extends Document {
    primaryContactId: mongoose.Types.ObjectId;
    uniqueCode: string;
    destination: string | null;
    travelDate: Date | null;
    returnDate: Date | null;
    flightFrom: string | null;
    flightTo: string | null;
    tripType: 'one-way' | 'round-trip' | 'multi-city';
    segments: {
        from: string;
        to: string;
        date: Date | null;
    }[];
    amount: number;
    totalAmount: number;
    finalQuotation: string | null;
    travellers: number | null;
    status: 'Pending' | 'Working' | 'Sent' | 'Booked' | 'Follow Up';
    followUpDate: Date | null;
    includesFlight: boolean;
    includesAdditionalServices: boolean;
    additionalServicesDetails: string | null;
    pricePerTicket: number | null;
    outstanding: number;
    createdByUserId: mongoose.Types.ObjectId;
    assignedToUserId: mongoose.Types.ObjectId | null;
    assignedGroup: string;
    company: string | null;
    isVerified: boolean;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    isConvertedToEDT: boolean;
    estimatedCosts: {
        costType: string;
        price: number;
        source: string;
    }[];
    actualCosts: {
        costType: string;
        price: number;
        source: string;
    }[];
    lastInteractionAt: Date;
    contact: {
        name: string;
        phone: string;
        email?: string | null;
        type: string;
        requirements?: string | null;
        interested: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        primaryContactId: { type: Schema.Types.ObjectId, ref: 'PrimaryContact', required: true },
        contact: {
            name: { type: String },
            phone: { type: String },
            email: { type: String },
            type: { type: String },
            requirements: { type: String },
            interested: { type: Boolean, default: false },
        },
        uniqueCode: { type: String, unique: true },
        destination: { type: String, default: null },
        travelDate: { type: Date, default: null },
        returnDate: { type: Date, default: null },
        flightFrom: { type: String, default: null },
        flightTo: { type: String, default: null },
        tripType: { type: String, enum: ['one-way', 'round-trip', 'multi-city'], default: 'one-way' },
        segments: [{
            from: { type: String, default: null },
            to: { type: String, default: null },
            date: { type: Date, default: null },
        }],
        amount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        finalQuotation: { type: String, default: null },
        travellers: { type: Number, default: null },
        status: { type: String, enum: ['Pending', 'Working', 'Sent', 'Booked', 'Follow Up'], default: 'Pending' },
        followUpDate: { type: Date, default: null },
        includesFlight: { type: Boolean, default: true },
        includesAdditionalServices: { type: Boolean, default: false },
        additionalServicesDetails: { type: String, default: null },
        pricePerTicket: { type: Number, default: 0 },
        outstanding: { type: Number, default: 0 },
        createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        assignedGroup: { type: String, default: 'Package / LCC' },
        company: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: String, default: null },
        verifiedAt: { type: Date, default: null },
        isConvertedToEDT: { type: Boolean, default: false },
        lastInteractionAt: { type: Date, default: Date.now },
        estimatedCosts: [{
            costType: { type: String },
            price: { type: Number },
            source: { type: String }
        }],
        actualCosts: [{
            costType: { type: String },
            price: { type: Number },
            source: { type: String }
        }],
    },
    {
        timestamps: true,
        toJSON: { 
            virtuals: true,
            transform: (doc, ret: any) => {
                ret.id = ret._id;
                // Use embedded contact snapshot for all flattened fields
                if (ret.contact) {
                    ret.contactPerson = ret.contact.name;
                    ret.contactNumber = ret.contact.phone;
                    ret.contactEmail = ret.contact.email;
                    ret.requirements = ret.contact.requirements;
                    ret.bookingType = ret.contact.type === 'B2B' ? 'B2B' : 'B2C';
                    ret.interested = ret.contact.interested ? 'Yes' : 'No';
                }
                
                // Flatten user names for display
                if (ret.assignedToUserId && typeof (ret.assignedToUserId as any).name === 'string') {
                    ret.assignedToUser = (ret.assignedToUserId as any).name;
                }
                if (ret.createdByUserId && typeof (ret.createdByUserId as any).name === 'string' && !ret.createdByUser) {
                    ret.createdByUser = (ret.createdByUserId as any).name;
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

// Indexes — Consolidated for Atlas M0 performance (sub-200ms target)
bookingSchema.index({ createdAt: -1 }); // Default List
bookingSchema.index({ assignedToUserId: 1, status: 1, lastInteractionAt: -1 }); // Agent Dashboard
bookingSchema.index({ status: 1, travelDate: 1 }); // Calendar/Upcoming
bookingSchema.index({ primaryContactId: 1, createdAt: -1 }); // Contact History
bookingSchema.index({ createdByUserId: 1, createdAt: -1 }); // Creator History
bookingSchema.index({ 'contact.phone': 1 }); // Search
bookingSchema.index({ updatedAt: -1 }); // Sync/Last Modified

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

bookingSchema.virtual('primaryContact', {
    ref: 'PrimaryContact',
    localField: 'primaryContactId',
    foreignField: '_id',
    justOne: true,
});

bookingSchema.virtual('timeline', {
    ref: 'Timeline',
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

// Pre-find hook to start timer
bookingSchema.pre(/^find/, function () {
    (this as any)._queryStart = Date.now();
});

// Post-find hook to log slow queries
bookingSchema.post(/^find/, function () {
    const duration = Date.now() - (this as any)._queryStart;
    if (duration > 100) {
        console.log(`[MONGOOSE SLOW] Booking.${(this as any).op} - ${duration}ms | filter: ${JSON.stringify((this as any)._conditions)}`);
    }
});

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
