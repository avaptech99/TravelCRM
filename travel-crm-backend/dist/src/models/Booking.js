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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bookingSchema = new mongoose_1.Schema({
    createdOn: { type: Date, default: Date.now },
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    contactPerson: { type: String, required: true },
    contactNumber: { type: String, required: true },
    requirements: { type: String, default: null },
    assignedToUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, default: 'Pending' },
    isConvertedToEDT: { type: Boolean, default: false },
    bookingType: { type: String, enum: ['B2B', 'B2C'], default: 'B2C' },
    interested: { type: String, enum: ['Yes', 'No'], default: 'No' },
    pricePerTicket: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes to speed up queries
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ assignedToUserId: 1 });
// Virtual properties to mirror Prisma include logic
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
bookingSchema.virtual('travelers', {
    ref: 'Traveler',
    localField: '_id',
    foreignField: 'bookingId',
});
const Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = Booking;
