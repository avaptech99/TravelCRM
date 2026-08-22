"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const Counter_1 = __importDefault(require("./Counter"));
const bookingSchema = new mongoose_1.Schema({
    primaryContactId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PrimaryContact', required: true },
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
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
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
            if (ret.assignedToUserId && typeof ret.assignedToUserId.name === 'string') {
                ret.assignedToUser = ret.assignedToUserId.name;
            }
            if (ret.createdByUserId && typeof ret.createdByUserId.name === 'string' && !ret.createdByUser) {
                ret.createdByUser = ret.createdByUserId.name;
            }
            return ret;
        }
    },
    toObject: { virtuals: true },
});
bookingSchema.pre('save', async function () {
    if (!this.uniqueCode) {
        try {
            const counter = await Counter_1.default.findByIdAndUpdate('bookingId', { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
            if (counter) {
                const seqStr = counter.seq.toString().padStart(4, '0');
                this.uniqueCode = `TW${seqStr}`;
            }
        }
        catch (error) {
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
    this._queryStart = Date.now();
});
// Post-find hook to log slow queries
bookingSchema.post(/^find/, function () {
    const duration = Date.now() - this._queryStart;
    if (duration > 100) {
        console.log(`[MONGOOSE SLOW] Booking.${this.op} - ${duration}ms | filter: ${JSON.stringify(this._conditions)}`);
    }
});
const Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = Booking;
