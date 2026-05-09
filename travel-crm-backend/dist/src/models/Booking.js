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
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
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
// Indexes — Optimized for Atlas M0 (Free Tier) to balance read speed and write overhead
bookingSchema.index({ travelDate: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ uniqueCode: 1 });
bookingSchema.index({ participantIds: 1, status: 1, createdAt: -1 }); // Covering index for most Agent/Marketer queries
bookingSchema.index({ status: 1, travelDate: 1 });
bookingSchema.index({ outstanding: 1, status: 1 }); // High-performance unpaid leads filtering
bookingSchema.index({ assignedGroup: 1, status: 1 }); // Covering index for group-based dashboard
bookingSchema.index({ 'contact.phone': 1 }); // Quick search by phone
bookingSchema.index({ uniqueCode: 1 }, { unique: true }); // Should already be covered by schema but explicit here
bookingSchema.index({ company: 1, status: 1, createdAt: -1 });
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
