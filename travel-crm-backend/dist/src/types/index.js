"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = exports.createPassengersSchema = exports.passengerSchema = exports.createCommentSchema = exports.assignBookingSchema = exports.updateBookingStatusSchema = exports.updateBookingSchema = exports.createBookingSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['ADMIN', 'AGENT']),
});
exports.createBookingSchema = zod_1.z.object({
    contactPerson: zod_1.z.string().min(2, 'Contact Person must be at least 2 characters'),
    contactNumber: zod_1.z.string().min(10, 'Contact Number must be a valid phone number'),
    bookingType: zod_1.z.enum(['B2B', 'B2C']),
    destination: zod_1.z.string().optional(),
    travelDate: zod_1.z.string().optional().nullable(),
    requirements: zod_1.z.string().optional(),
    flightFrom: zod_1.z.string().optional(),
    flightTo: zod_1.z.string().optional(),
    tripType: zod_1.z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    segments: zod_1.z.array(zod_1.z.object({
        from: zod_1.z.string().optional(),
        to: zod_1.z.string().optional(),
        date: zod_1.z.string().optional().nullable(),
    })).optional(),
    amount: zod_1.z.number().nonnegative().optional(),
    travellers: zod_1.z.number().int().positive().optional(),
});
exports.updateBookingSchema = zod_1.z.object({
    destination: zod_1.z.string().optional(),
    travelDate: zod_1.z.string().optional().nullable(),
    flightFrom: zod_1.z.string().optional(),
    flightTo: zod_1.z.string().optional(),
    tripType: zod_1.z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    segments: zod_1.z.array(zod_1.z.object({
        from: zod_1.z.string().optional(),
        to: zod_1.z.string().optional(),
        date: zod_1.z.string().optional().nullable(),
    })).optional(),
    amount: zod_1.z.number().nonnegative().optional(),
    totalAmount: zod_1.z.number().nonnegative().optional(),
    finalQuotation: zod_1.z.string().optional().nullable(),
    requirements: zod_1.z.string().optional(),
    interested: zod_1.z.enum(['Yes', 'No']).optional(),
    bookingType: zod_1.z.enum(['B2B', 'B2C']).optional(),
    travellers: zod_1.z.number().int().positive().optional(),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Pending', 'Working', 'Sent', 'Booked']),
});
exports.assignBookingSchema = zod_1.z.object({
    assignedToUserId: zod_1.z.string().nullable().optional(),
});
exports.createCommentSchema = zod_1.z.object({
    text: zod_1.z.string().min(1),
});
exports.passengerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phoneNumber: zod_1.z.string().regex(/^\+\d{1,4}\d{10}$/, 'Phone number must have country code and 10 digits').optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    dob: zod_1.z.string().optional(),
    anniversary: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    flightFrom: zod_1.z.string().optional(),
    flightTo: zod_1.z.string().optional(),
    departureTime: zod_1.z.string().optional(),
    arrivalTime: zod_1.z.string().optional(),
    tripType: zod_1.z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    returnDate: zod_1.z.string().optional(),
    returnDepartureTime: zod_1.z.string().optional(),
    returnArrivalTime: zod_1.z.string().optional(),
});
exports.createPassengersSchema = zod_1.z.array(exports.passengerSchema);
exports.createPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    paymentMethod: zod_1.z.string().min(1),
    transactionId: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(), // ISO date string
});
