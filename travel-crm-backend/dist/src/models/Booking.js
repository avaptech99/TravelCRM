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
    primaryContactId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PrimaryContact', required: true },
    uniqueCode: { type: String, unique: true },
    destination: { type: String, default: null },
    travelDate: { type: Date, default: null },
    flightFrom: { type: String, default: null },
    flightTo: { type: String, default: null },
    tripType: { type: String, enum: ['one-way', 'round-trip'], default: 'one-way' },
    amount: { type: Number, default: 0 },
    travellers: { type: Number, default: null },
    status: { type: String, enum: ['Pending', 'Working', 'Sent', 'Booked'], default: 'Pending' },
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
bookingSchema.pre('save', function () {
    if (!this.uniqueCode) {
        // Simple random 4-digit code (e.g., 6819) to match aaaa.png
        this.uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
    }
});
// Indexes to speed up queries
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ assignedToUserId: 1 });
bookingSchema.index({ createdByUserId: 1 });
bookingSchema.index({ primaryContactId: 1 });
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
const Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = Booking;
