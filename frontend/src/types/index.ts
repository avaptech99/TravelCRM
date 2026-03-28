export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'AGENT';
    isOnline?: boolean;
    lastSeen?: string;
}

export interface Traveler {
    id: string;
    bookingId: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    country?: string;
    flightFrom?: string;
    flightTo?: string;
    departureTime?: string;
    arrivalTime?: string;
    tripType?: string;
    returnDate?: string;
    returnDepartureTime?: string;
    returnArrivalTime?: string;
    dob?: string;
    anniversary?: string;
}

export interface Comment {
    id: string;
    bookingId: string;
    text: string;
    createdBy: User;
    createdById: string;
    createdAt: string;
}

export interface Payment {
    id: string;
    bookingId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    remarks?: string;
    date: string;
    createdAt: string;
}

export interface Booking {
    id: string;
    createdOn: string;
    contactPerson: string;
    contactNumber: string;
    contactEmail?: string;
    requirements?: string;
    status: 'Pending' | 'Working' | 'Sent' | 'Booked';
    assignedToUser?: User;
    assignedToUserId?: string;
    createdByUser: User;
    createdByUserId: string;
    isConvertedToEDT: boolean;
    bookingType: 'B2B' | 'B2C' | string;
    travelers: Traveler[];
    comments: Comment[];
    payments: Payment[];
    pricePerTicket?: number;
    totalAmount?: number;
    interested?: 'Yes' | 'No';
    uniqueCode?: string;
    fromCity?: string;
    destinationCity?: string;
    flightFrom?: string;
    flightTo?: string;
    tripType?: 'one-way' | 'round-trip';
    travelDate?: string;
    returnDate?: string;
    travellers?: number;
    duration?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface Notification {
    _id: string; // From mongoose
    userId: string;
    bookingId?: string;
    message: string;
    read: boolean;
    createdAt: string;
}
