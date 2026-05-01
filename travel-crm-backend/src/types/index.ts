import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'AGENT', 'MARKETER']),
    permissions: z.object({
        leadVisibility: z.enum(['all', 'own', 'none']).optional(),
        canAssignLeads: z.boolean().optional(),
        canEditActualCost: z.boolean().optional(),
        canVerifyBookings: z.boolean().optional(),
        canManageUsers: z.boolean().optional(),
        canViewReports: z.boolean().optional(),
        featureAccess: z.object({
            visa: z.boolean().optional(),
            ticketing: z.boolean().optional(),
            operation: z.boolean().optional(),
            account: z.boolean().optional(),
        }).optional(),
    }).optional(),
});

export const createBookingSchema = z.object({
    contactPerson: z.string().min(2, 'Contact Person must be at least 2 characters'),
    contactNumber: z.string().min(10, 'Contact Number must be a valid phone number'),
    bookingType: z.enum(['B2B', 'B2C']),
    destination: z.string().optional().nullable(),
    travelDate: z.string().optional().nullable(),
    requirements: z.string().optional().nullable(),
    flightFrom: z.string().optional().nullable(),
    flightTo: z.string().optional().nullable(),
    tripType: z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    segments: z.array(z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        date: z.string().optional().nullable(),
    })).optional(),
    amount: z.number().nonnegative().optional(),
    travellers: z.number().int().positive().optional(),
    pricePerTicket: z.number().nonnegative().optional(),
    includesFlight: z.boolean().optional(),
    includesAdditionalServices: z.boolean().optional(),
    additionalServicesDetails: z.string().optional().nullable(),
    assignedGroup: z.string().optional().nullable(),
});

export const updateBookingSchema = z.object({
    destination: z.string().optional().nullable(),
    travelDate: z.string().optional().nullable(),
    flightFrom: z.string().optional().nullable(),
    flightTo: z.string().optional().nullable(),
    tripType: z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    segments: z.array(z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        date: z.string().optional().nullable(),
    })).optional(),
    amount: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
    finalQuotation: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    assignedGroup: z.string().optional().nullable(),
    estimatedCosts: z.array(z.object({
        costType: z.string(),
        price: z.number(),
        source: z.string().optional(),
    })).optional(),
    actualCosts: z.array(z.object({
        costType: z.string(),
        price: z.number(),
        source: z.string().optional(),
    })).optional(),
    requirements: z.string().optional(),
    interested: z.enum(['Yes', 'No']).optional(),
    bookingType: z.enum(['B2B', 'B2C']).optional(),
    travellers: z.number().int().positive().optional(),
    pricePerTicket: z.number().nonnegative().optional(),
    includesFlight: z.boolean().optional(),
    includesAdditionalServices: z.boolean().optional(),
    additionalServicesDetails: z.string().optional().nullable(),
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
    country: z.string().optional(),
    flightFrom: z.string().optional(),
    flightTo: z.string().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    tripType: z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    returnDate: z.string().optional(),
    returnDepartureTime: z.string().optional(),
    returnArrivalTime: z.string().optional(),
});

export const createPassengersSchema = z.array(passengerSchema);

export const bulkAssignSchema = z.object({
    bookingIds: z.array(z.string()),
    assignedToUserId: z.string().nullable().optional(),
});

export const createPaymentSchema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.string().min(1),
    transactionId: z.string().optional(),
    remarks: z.string().optional(),
    date: z.string().optional(), // ISO date string
});
