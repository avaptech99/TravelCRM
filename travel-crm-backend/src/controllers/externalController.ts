import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import User from '../models/User';
import appCache from '../utils/cache';

// Helper: Find or create a system user named "Website Lead"
const getWebsiteLeadUser = async () => {
    let user = await User.findOne({ email: 'website-lead@system.internal' });
    if (!user) {
        // Create a system user (no real password, cannot login)
        user = await User.create({
            name: 'Website Lead',
            email: 'website-lead@system.internal',
            passwordHash: 'SYSTEM_NO_LOGIN',
            role: 'AGENT',
        });
    }
    return user;
};

// @desc    Create lead from external source (e.g. WordPress)
// @route   POST /api/external/lead
// @access  Public (Protected by API Key)
export const createExternalLead = asyncHandler(async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
        res.status(401);
        throw new Error('Unauthorized: Invalid API Key');
    }

    const {
        contactPerson,
        contactNumber,
        contactEmail,
        flightFrom,
        flightTo,
        travelDate,
        returnDate,
        travellers,
        tripType,
        requirements,
        adults,
        children,
        infants,
        class: travelClass
    } = req.body;

    if (!contactNumber) {
        res.status(400);
        throw new Error('Contact number is required');
    }

    // Extract name from email if contactPerson not provided
    let finalName = contactPerson || 'Website Lead';
    if ((!contactPerson || contactPerson === 'Website Lead') && contactEmail) {
        const emailPart = contactEmail.split('@')[0];
        finalName = emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    // Calculate total travellers
    let totalTravellers = 0;
    if (adults || children || infants) {
        totalTravellers = (Number(adults) || 0) + (Number(children) || 0) + (Number(infants) || 0);
    } else if (typeof travellers === 'number') {
        totalTravellers = travellers;
    }

    // Normalize trip type from WordPress (e.g., formats like "Round Trip", "round-trip", "Multi City")
    const normalizedTripType = (tripType || '').toLowerCase().replace(/[^a-z]/g, '');
    let finalTripType = 'one-way';
    let addedTripNote = '';

    if (normalizedTripType.includes('round')) {
        finalTripType = 'round-trip';
    } else if (normalizedTripType.includes('multi')) {
        addedTripNote = `\nTrip Type: Multi-City`;
    }

    // Prepare requirements summary
    let detailedRequirements = requirements || '';
    if (tripType) detailedRequirements += `\nTrip Type (Original): ${tripType}`;
    if (travelDate) detailedRequirements += `\nTravel Date: ${travelDate}`;
    if (returnDate) detailedRequirements += `\nReturn Date: ${returnDate}`;
    if (flightFrom) detailedRequirements += `\nFlight From: ${flightFrom}`;
    if (flightTo) detailedRequirements += `\nFlight To: ${flightTo}`;
    if (travelClass) detailedRequirements += `\nClass: ${travelClass}`;
    if (addedTripNote) detailedRequirements += addedTripNote;
    if (adults || children || infants) {
        detailedRequirements += `\nBreakdown: ${adults || 0} Adults, ${children || 0} Children, ${infants || 0} Infants`;
    }

    // Get "Website Lead" system user so Created By shows "Website Lead"
    const websiteLeadUser = await getWebsiteLeadUser();

    // 1. Create PrimaryContact
    const primaryContact = await PrimaryContact.create({
        contactName: finalName,
        contactPhoneNo: contactNumber,
        contactEmail: contactEmail || null,
        bookingType: 'Direct (B2C)',
        requirements: detailedRequirements.trim() || null,
    });

    // Safely parse European date format (DD/MM/YYYY) to prevent Mongoose CastError
    let parsedTravelDate: Date | null = null;
    if (travelDate) {
        if (travelDate.includes('/')) {
            const parts = travelDate.split('/');
            if (parts.length === 3) {
                // new Date(YYYY, MM-1, DD)
                parsedTravelDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
        } else if (travelDate.includes('-')) {
            const parts = travelDate.split('-');
            if (parts[0].length === 2 && parts.length === 3) { // DD-MM-YYYY
                parsedTravelDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            } else {
                parsedTravelDate = new Date(travelDate); // YYYY-MM-DD
            }
        } else {
            parsedTravelDate = new Date(travelDate);
        }

        // Validate parsed date
        if (parsedTravelDate && isNaN(parsedTravelDate.getTime())) {
            parsedTravelDate = null;
        }
    }

    // 2. Create Booking (status defaults to "Pending", createdAt is automatic)
    const booking = await Booking.create({
        destination: flightTo || null,
        travelDate: parsedTravelDate,
        flightFrom: flightFrom || null,
        flightTo: flightTo || null,
        tripType: finalTripType,
        travellers: totalTravellers || null,
        primaryContactId: primaryContact._id,
        createdByUserId: websiteLeadUser._id, // Shows "Website Lead" in Created By
        assignedToUserId: null,
    });


    // Invalidate caches
    appCache.invalidateByPrefix('bookings_');
    appCache.invalidateByPrefix('stats_');
    appCache.invalidateByPrefix('recent_');

    res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        bookingId: booking._id,
        uniqueCode: (booking as any).uniqueCode
    });
});
