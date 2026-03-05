"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTravelersSchema = exports.travelerSchema = exports.createCommentSchema = exports.assignBookingSchema = exports.updateBookingStatusSchema = exports.createBookingSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.createBookingSchema = zod_1.z.object({
    contactPerson: zod_1.z.string().min(2),
    contactNumber: zod_1.z.string().min(5),
    requirements: zod_1.z.string().optional(),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Pending', 'Working', 'Sent', 'Booked']),
});
exports.assignBookingSchema = zod_1.z.object({
    assignedToUserId: zod_1.z.string().uuid(),
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
    travelDate: zod_1.z.string().optional(),
    dob: zod_1.z.string().optional(),
    anniversary: zod_1.z.string().optional(),
    isPrimary: zod_1.z.boolean().default(false).optional(),
});
exports.createTravelersSchema = zod_1.z.array(exports.travelerSchema);
