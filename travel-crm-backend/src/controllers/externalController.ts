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

    // Normalize trip type
    const normalizedTripType = (tripType || '').toLowerCase().replace(/[^a-z]/g, '');
    let finalTripType: 'one-way' | 'round-trip' | 'multi-city' = 'one-way';

    if (normalizedTripType.includes('round')) {
        finalTripType = 'round-trip';
    } else if (normalizedTripType.includes('multi')) {
        finalTripType = 'multi-city';
    }

    // Helper: Parse European date (DD/MM/YYYY)
    const parseDate = (dateStr: any): Date | null => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        let parsed: Date | null = null;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                parsed = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 2 && parts.length === 3) { // DD-MM-YYYY
                parsed = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            } else {
                parsed = new Date(dateStr); // YYYY-MM-DD
            }
        } else {
            parsed = new Date(dateStr);
        }
        return (parsed && !isNaN(parsed.getTime())) ? parsed : null;
    };

    // Detailed Requirements catch-all (Captures ALL fields for safety)
    let detailedRequirements = `Direct Booking Inquiry from Website\n\n`;
    detailedRequirements += `--- Additional Customer Information ---\n`;
    
    // Fields already processed or internal to CRM
    const excludedFields = ['apiKey', 'contactPerson', 'contactNumber', 'contactEmail', 'detailedRequirements', 'segments'];
    
    Object.entries(req.body).forEach(([key, value]) => {
        // Skip excluded, empty, or internal-looking Ninja Forms keys (like '37.1_0' or numeric IDs)
        // unless they are explicitly mapped in the WP script.
        const isInternalNF = /^\d+(_\d+)?$/.test(key) || key.includes('_0');
        
        if (!excludedFields.includes(key) && value && !isInternalNF) {
            // Format key for better readability (un-camelcase, replace underscores with spaces, capitalize)
            const label = key
                .replace(/([A-Z])/g, ' $1') // Handle camelCase
                .replace(/_/g, ' ')         // Handle snake_case
                .trim()
                .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
                
            detailedRequirements += `${label}: ${value}\n`;
        }
    });
    detailedRequirements += `\n-------------------\n`;

    const segments: any[] = [];
    
    // Look for multi-city segments (N=1,2,3...)
    // Pattern matches: flightFrom_1, travelDate_2, from_3, to_1, etc.
    for (let i = 1; i <= 10; i++) {
        const from = req.body[`flightFrom_${i}`] || req.body[`from_${i}`];
        const to = req.body[`flightTo_${i}`] || req.body[`to_${i}`];
        const date = req.body[`travelDate_${i}`] || req.body[`departure_${i}`] || req.body[`date_${i}`];
        
        if (from || to || date) {
            segments.push({
                from: from || 'TBD',
                to: to || 'TBD',
                date: parseDate(date)
            });
        }
    }

    // If no segments found but it's multi-city, maybe we can use the primary one as segment 1
    if (segments.length === 0 && finalTripType === 'multi-city' && (flightFrom || flightTo)) {
        segments.push({
            from: flightFrom || 'TBD',
            to: flightTo || 'TBD',
            date: parseDate(travelDate)
        });
    }

    // Get "Website Lead" system user
    const websiteLeadUser = await getWebsiteLeadUser();

    // 1. Create PrimaryContact
    const primaryContact = await PrimaryContact.create({
        contactName: finalName,
        contactPhoneNo: contactNumber,
        contactEmail: contactEmail || null,
        bookingType: 'Direct (B2C)',
        requirements: detailedRequirements.trim() || null,
    });

    // 2. Create Booking
    const booking = await Booking.create({
        destination: flightTo || (segments.length > 0 ? segments[segments.length - 1].to : null),
        travelDate: parseDate(travelDate) || (segments.length > 0 ? segments[0].date : null),
        returnDate: parseDate(returnDate),
        flightFrom: flightFrom || (segments.length > 0 ? segments[0].from : null),
        flightTo: flightTo || (segments.length > 0 ? segments[0].to : null),
        tripType: finalTripType,
        segments,
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
