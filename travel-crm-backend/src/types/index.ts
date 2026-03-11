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
    contactPerson: z.string().min(2, 'Name must be at least 2 characters'),
    contactNumber: z.string().regex(/^\+\d{1,4}\d{10}$/, 'Phone number must have country code and 10 digits'),
    requirements: z.string().min(1, 'Requirements are compulsory'),
    bookingType: z.enum(['B2B', 'B2C']).default('B2C'),
});

export const updateBookingSchema = z.object({
    requirements: z.string().optional(),
    pricePerTicket: z.number().nonnegative().optional(),
    totalAmount: z.number().optional(),
    interested: z.enum(['Yes', 'No']).optional(),
    bookingType: z.enum(['B2B', 'B2C']).optional(),
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

export const travelerSchema = z.object({
    name: z.string().min(1),
    phoneNumber: z.string().regex(/^\+\d{1,4}\d{10}$/, 'Phone number must have country code and 10 digits').optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    country: z.string().optional(),
    flightFrom: z.string().optional(),
    flightTo: z.string().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    tripType: z.enum(['one-way', 'round-trip']).optional(),
    returnDate: z.string().optional(),
    returnDepartureTime: z.string().optional(),
    returnArrivalTime: z.string().optional(),
    dob: z.string().optional(),
    anniversary: z.string().optional(),
    isPrimary: z.boolean().default(false).optional(),
});

export const createTravelersSchema = z.array(travelerSchema);

export const createPaymentSchema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.string().min(1),
    transactionId: z.string().optional(),
    remarks: z.string().optional(),
    date: z.string().optional(), // ISO date string
});
