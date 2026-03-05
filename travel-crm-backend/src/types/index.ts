import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const createBookingSchema = z.object({
    contactPerson: z.string().min(2),
    contactNumber: z.string().min(5),
    requirements: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
    status: z.enum(['Pending', 'Working', 'Sent', 'Booked']),
});

export const assignBookingSchema = z.object({
    assignedToUserId: z.string().uuid(),
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
    travelDate: z.string().optional(),
    dob: z.string().optional(),
    anniversary: z.string().optional(),
    isPrimary: z.boolean().default(false).optional(),
});

export const createTravelersSchema = z.array(travelerSchema);
