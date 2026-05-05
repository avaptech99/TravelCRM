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
    status: { type: String, enum: ['Pending', 'Working', 'Sent', 'Booked'], default: 'Pending' },
    includesFlight: { type: Boolean, default: true },
    includesAdditionalServices: { type: Boolean, default: false },
    additionalServicesDetails: { type: String, default: null },
    pricePerTicket: { type: Number, default: 0 },
    outstanding: { type: Number, default: 0 },
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
<<<<<<< Updated upstream
}, {
    timestamps: true,
    toJSON: { virtuals: true },
=======
    assignedGroup: { type: String, default: 'Package / LCC' },
    company: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
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
            // Flatten primaryContact fields from embedded snapshot if exists
            if (ret.contact) {
                ret.contactPerson = ret.contact.name;
                ret.contactNumber = ret.contact.phone;
                ret.bookingType = ret.contact.type === 'Agent (B2B)' ? 'B2B' : 'B2C';
            }
            else if (ret.primaryContact) {
                ret.contactPerson = ret.primaryContact.contactName;
                ret.contactNumber = ret.primaryContact.contactPhoneNo;
                ret.bookingType = ret.primaryContact.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C';
            }
            if (ret.primaryContact) {
                ret.contactEmail = ret.primaryContact.contactEmail;
                ret.requirements = ret.primaryContact.requirements;
                ret.interested = ret.primaryContact.interested;
            }
            // Flatten user names for display
            if (ret.assignedToUserId && typeof ret.assignedToUserId === 'object') {
                ret.assignedToUser = ret.assignedToUserId.name;
            }
            if (ret.createdByUserId && typeof ret.createdByUserId === 'object' && !ret.createdByUser) {
                ret.createdByUser = ret.createdByUserId.name;
            }
            return ret;
        }
    },
>>>>>>> Stashed changes
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
// Indexes to speed up queries - Refined for performance
bookingSchema.index({ assignedToUserId: 1, status: 1, lastInteractionAt: -1 });
bookingSchema.index({ status: 1, travelDate: 1 });
bookingSchema.index({ primaryContactId: 1, createdAt: -1 });
bookingSchema.index({ createdByUserId: 1, createdAt: -1 });
bookingSchema.index({ uniqueCode: 1 }, { sparse: true });
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
const Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = Booking;
