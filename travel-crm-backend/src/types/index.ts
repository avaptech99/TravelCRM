import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'AGENT']),
});

export const createBookingSchema = z.object({
    contactPerson: z.string().min(2, 'Contact Person must be at least 2 characters'),
    contactNumber: z.string().min(10, 'Contact Number must be a valid phone number'),
    bookingType: z.enum(['B2B', 'B2C']),
    destination: z.string().optional(),
    travelDate: z.string().optional().nullable(),
    requirements: z.string().optional(),
    flightFrom: z.string().optional(),
    flightTo: z.string().optional(),
    tripType: z.enum(['one-way', 'round-trip']).optional(),
    amount: z.number().nonnegative().optional(),
    travellers: z.number().int().positive().optional(),
});

export const updateBookingSchema = z.object({
    destination: z.string().optional(),
    travelDate: z.string().optional().nullable(),
    flightFrom: z.string().optional(),
    flightTo: z.string().optional(),
    tripType: z.enum(['one-way', 'round-trip']).optional(),
    amount: z.number().nonnegative().optional(),
    requirements: z.string().optional(),
    interested: z.enum(['Yes', 'No']).optional(),
    bookingType: z.enum(['B2B', 'B2C']).optional(),
    travellers: z.number().int().positive().optional(),
});

export const updateBookingStatusSchema = z.object({
    status: z.enum(['Pending', 'Working', 'Sent', 'Booked']),
});

export const assignBookingSchema = z.object({
    assignedToUserId: z.string().nullable().optional(),
});

export const createCommentSchema = z.object({
    text: z.string().min(1),
});

export const passengerSchema = z.object({
    name: z.string().min(1),
    phoneNumber: z.string().regex(/^\+\d{1,4}\d{10}$/, 'Phone number must have country code and 10 digits').optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    dob: z.string().optional(),
    anniversary: z.string().optional(),
});

export const createPassengersSchema = z.array(passengerSchema);

export const createPaymentSchema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.string().min(1),
    transactionId: z.string().optional(),
    remarks: z.string().optional(),
    date: z.string().optional(), // ISO date string
});
