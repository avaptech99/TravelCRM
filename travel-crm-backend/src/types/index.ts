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
    contactPerson: z.string().min(2),
    contactNumber: z.string().min(5),
    requirements: z.string().optional(),
});

export const updateBookingSchema = z.object({
    requirements: z.string().optional(),
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
    name: z.string().min(2),
    phoneNumber: z.string().optional(),
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
