"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = exports.createTravelersSchema = exports.travelerSchema = exports.createCommentSchema = exports.assignBookingSchema = exports.updateBookingStatusSchema = exports.updateBookingSchema = exports.createBookingSchema = exports.createUserSchema = exports.loginSchema = void 0;
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
    contactPerson: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    contactNumber: zod_1.z.string().min(5, 'Phone number must be at least 5 characters'),
    requirements: zod_1.z.string().min(1, 'Requirements are compulsory'),
    bookingType: zod_1.z.enum(['B2B', 'B2C']).default('B2C'),
});
exports.updateBookingSchema = zod_1.z.object({
    requirements: zod_1.z.string().optional(),
    pricePerTicket: zod_1.z.number().nonnegative().optional(),
    totalAmount: zod_1.z.number().optional(),
    interested: zod_1.z.enum(['Yes', 'No']).optional(),
    bookingType: zod_1.z.enum(['B2B', 'B2C']).optional(),
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
exports.travelerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    phoneNumber: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    country: zod_1.z.string().optional(),
    flightFrom: zod_1.z.string().optional(),
    flightTo: zod_1.z.string().optional(),
    departureTime: zod_1.z.string().optional(),
    arrivalTime: zod_1.z.string().optional(),
    tripType: zod_1.z.enum(['one-way', 'round-trip']).optional(),
    returnDate: zod_1.z.string().optional(),
    returnDepartureTime: zod_1.z.string().optional(),
    returnArrivalTime: zod_1.z.string().optional(),
    dob: zod_1.z.string().optional(),
    anniversary: zod_1.z.string().optional(),
    isPrimary: zod_1.z.boolean().default(false).optional(),
});
exports.createTravelersSchema = zod_1.z.array(exports.travelerSchema);
exports.createPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    paymentMethod: zod_1.z.string().min(1),
    transactionId: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(), // ISO date string
});
