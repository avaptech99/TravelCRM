import mongoose, { Document, Model, Schema } from 'mongoose';
import Counter from './Counter';

export interface IBooking extends Document {
    primaryContactId: mongoose.Types.ObjectId;
    uniqueCode: string;
    segments: {
        from: string;
        to: string;
        departureDate: Date | null;
        returnDate: Date | null;
        returnDepartureTime: string | null;
        tripType: 'one-way' | 'round-trip' | 'multi-city';
        country: string | null;
    }[];
    totalAmount: number;
    outstanding: number;
    finalQuotation: string | null;
    status: 'Pending' | 'Working' | 'Sent' | 'Booked' | 'Follow Up';
    followUpDate: Date | null;
    additionalServicesDetails: string | null;
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
    actualAmount: number;
    estimatedMargin: number;
    actualMargin: number;
    createdByUserId: mongoose.Types.ObjectId;
    assignedToUserId: mongoose.Types.ObjectId | null;
    assignedGroup: string;
    company: string | null;
    isVerified: boolean;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    lastInteractionAt: Date;
    callDisposition: 'MISSED' | 'ANSWERED' | 'OUTBOUND' | null;
    pbxCallId: string | null;
    participantIds: mongoose.Types.ObjectId[];
    contact: {
        name: string;
        phone: string;
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
            type: { type: String },
            requirements: { type: String },
            interested: { type: Boolean, default: false },
        },
        uniqueCode: { type: String, unique: true },
        segments: [{
            from: { type: String, default: '' },
            to: { type: String, default: '' },
            departureDate: { type: Date, default: null },
            returnDate: { type: Date, default: null },
            returnDepartureTime: { type: String, default: null },
            tripType: { type: String, enum: ['one-way', 'round-trip', 'multi-city'], default: 'one-way' },
            country: { type: String, default: null },
        }],
        totalAmount: { type: Number, default: 0 },
        finalQuotation: { type: String, default: null },
        status: { type: String, enum: ['Pending', 'Working', 'Sent', 'Booked', 'Follow Up'], default: 'Pending' },
        followUpDate: { type: Date, default: null },
        additionalServicesDetails: { type: String, default: null },
        outstanding: { type: Number, default: 0 },
        createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        assignedGroup: { type: String, default: 'Package / LCC' },
        company: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: String, default: null },
        verifiedAt: { type: Date, default: null },
        lastInteractionAt: { type: Date, default: Date.now },
        callDisposition: { type: String, enum: ['MISSED', 'ANSWERED', 'OUTBOUND'], default: null },
        pbxCallId: { type: String, default: null, index: true, sparse: true },
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
        actualAmount: { type: Number, default: 0 },
        estimatedMargin: { type: Number, default: 0 },
        actualMargin: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        toJSON: { 
            virtuals: true,
            transform: (doc, ret: any) => {
                ret.id = ret._id;

                // ── Backward-compatible flattened fields derived from segments[0] ──
                const seg0 = ret.segments && ret.segments.length > 0 ? ret.segments[0] : null;
                ret.travelDate = seg0?.departureDate || null;
                ret.returnDate = seg0?.returnDate || null;
                ret.flightFrom = seg0?.from || null;
                ret.flightTo = seg0?.to || null;
                ret.tripType = seg0?.tripType || 'one-way';
                ret.destination = seg0?.country || null;
                // Derived booleans
                ret.includesFlight = (ret.segments && ret.segments.length > 0);
                ret.includesAdditionalServices = !!(ret.additionalServicesDetails && ret.additionalServicesDetails.trim());
                // Legacy amount alias
                ret.amount = ret.totalAmount;

                // Use embedded contact snapshot for all flattened fields
                if (ret.contact) {
                    ret.contactPerson = ret.contact.name;
                    ret.contactNumber = ret.contact.phone;
                    ret.contactEmail = ret.contact.email || null;
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

// Indexes — Optimized for Atlas M0 (Free Tier)
bookingSchema.index({ uniqueCode: 1 }, { unique: true, sparse: true });
bookingSchema.index({ status: 1, 'segments.0.departureDate': 1 }); // Calendar + upcoming trips
bookingSchema.index({ participantIds: 1, status: 1, createdAt: -1 }); // Covering index for Agent/Marketer queries
bookingSchema.index({ createdAt: -1 }); // Date-sorted list views
bookingSchema.index({ assignedToUserId: 1, status: 1, lastInteractionAt: -1 }); // Agent dashboard
bookingSchema.index({ callDisposition: 1, lastInteractionAt: -1 }); // Missed calls view

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

bookingSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'bookingId',
});

bookingSchema.virtual('activities', {
    ref: 'Timeline',
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
