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

    // Helper: Parse European date (DD/MM/YYYY)
    const parseDate = (dateStr: any): Date | null => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const trimmed = dateStr.trim();
        let parsed: Date | null = null;
        if (trimmed.includes('/')) {
            const parts = trimmed.split('/');
            if (parts.length === 3) {
                parsed = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
        } else if (trimmed.includes('-')) {
            const parts = trimmed.split('-');
            if (parts[0].length === 2 && parts.length === 3) {
                parsed = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            } else {
                parsed = new Date(trimmed);
            }
        } else {
            parsed = new Date(trimmed);
        }
        return (parsed && !isNaN(parsed.getTime())) ? parsed : null;
    };

    // ============================================================
    // NEW: Handle raw_fields from simplified WordPress v4.0 script
    // ============================================================
    const rawFields: Array<{key: string; label: string; value: any}> = req.body.raw_fields || [];

    let contactPerson = '';
    let contactNumber = '';
    let contactEmail = '';
    let flightFrom = '';
    let flightTo = '';
    let travelDate = '';
    let returnDate = '';
    let tripType = '';
    let adults = 0;
    let children = 0;
    let infants = 0;
    let travelClass = 'Economy';

    // Additional legs from repeater fields
    const additionalLegs: Array<{from: string; to: string; date: string}> = [];

    if (rawFields.length > 0) {
        // ---- PARSE RAW FIELDS ----
        for (const field of rawFields) {
            const label = (field.label || '').trim();
            const lLow = label.toLowerCase();
            const val = field.value;

            // Skip empty, submit buttons, internal IDs
            if (!val) continue;
            if (typeof val === 'string' && lLow.includes('submit')) continue;

            // ---- REPEATER / ADD CITY DATA ----
            // Ninja Forms sends repeater data as a FLAT OBJECT like:
            // { "37.1_0": {"value":"tronto","id":"..."}, "37.2_0": {"value":"Dubai","id":"..."}, "37.3_0": {"value":"30/03/2026","id":"..."}, 
            //   "37.1_1": {"value":"dubai","id":"..."}, "37.2_1": {"value":"Singapore","id":"..."}, "37.3_1": {"value":"31/03/2026","id":"..."} }
            // Pattern: X.Y_Z  where Y=field position (1=from, 2=to, 3=date), Z=row index
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                // Group entries by row index (the _Z suffix)
                const rows: Record<string, Array<{pos: string; value: string}>> = {};
                
                for (const [k, v] of Object.entries(val)) {
                    // Extract the value string from {value: "...", id: "..."}
                    let extractedVal = '';
                    if (typeof v === 'object' && v !== null && 'value' in v) {
                        extractedVal = String((v as any).value).trim();
                    } else if (typeof v === 'string') {
                        extractedVal = v.trim();
                    }
                    if (!extractedVal) continue;
                    
                    // Parse key like "37.1_0" -> pos="37.1", rowIdx="0"
                    const match = k.match(/^(\d+\.\d+)_(\d+)$/);
                    if (match) {
                        const pos = match[1];  // e.g. "37.1"
                        const rowIdx = match[2]; // e.g. "0"
                        if (!rows[rowIdx]) rows[rowIdx] = [];
                        rows[rowIdx].push({ pos, value: extractedVal });
                    }
                }

                // Sort rows by index and extract From, To, Date for each
                const sortedRowKeys = Object.keys(rows).sort((a, b) => Number(a) - Number(b));
                for (const rowIdx of sortedRowKeys) {
                    const rowFields = rows[rowIdx].sort((a, b) => a.pos.localeCompare(b.pos));
                    // Fields come in order: .1 = From, .2 = To, .3 = Date
                    if (rowFields.length >= 2) {
                        additionalLegs.push({
                            from: rowFields[0]?.value || '',
                            to: rowFields[1]?.value || '',
                            date: rowFields[2]?.value || ''
                        });
                    }
                }
                continue;
            }

            // Also handle if it comes as an actual array (safety fallback)
            if (Array.isArray(val)) {
                for (const row of val) {
                    if (typeof row === 'object' && row !== null) {
                        const values: string[] = [];
                        for (const [k, v] of Object.entries(row)) {
                            if (k.endsWith('_id') || k.includes('_id_')) continue;
                            if (typeof v === 'string' && v.trim()) values.push(v.trim());
                        }
                        if (values.length >= 2) {
                            additionalLegs.push({ from: values[0], to: values[1], date: values[2] || '' });
                        }
                    }
                }
                continue;
            }

            // ---- STANDARD SINGLE FIELDS ----
            const strVal = String(val).trim();
            if (!strVal) continue;

            if (lLow === 'from') { flightFrom = strVal; }
            else if (lLow === 'to') { flightTo = strVal; }
            else if (lLow === 'departure') { travelDate = strVal; }
            else if (lLow === 'return' || lLow.includes('return date') || lLow.includes('return')) { returnDate = strVal; }
            else if (lLow.includes('adult')) { adults = parseInt(strVal) || 0; }
            else if (lLow.includes('child')) { children = parseInt(strVal) || 0; }
            else if (lLow.includes('infant')) { infants = parseInt(strVal) || 0; }
            else if (lLow.includes('class')) { travelClass = strVal; }
            else if (lLow.includes('radio') || lLow.includes('trip')) { tripType = strVal; }
            else if (lLow.includes('email')) { contactEmail = strVal; }
            else if (lLow.includes('phone') || lLow.includes('mobile')) { contactNumber = strVal; }
            else if (lLow.includes('name') && !lLow.includes('user')) { contactPerson = strVal; }
        }
    } else {
        // Legacy: direct key-value payload (old WordPress scripts)
        contactPerson = req.body.contactPerson || '';
        contactNumber = req.body.contactNumber || '';
        contactEmail = req.body.contactEmail || '';
        flightFrom = req.body.flightFrom || '';
        flightTo = req.body.flightTo || '';
        travelDate = req.body.travelDate || '';
        returnDate = req.body.returnDate || '';
        tripType = req.body.tripType || '';
        adults = Number(req.body.adults) || 0;
        children = Number(req.body.children) || 0;
        infants = Number(req.body.infants) || 0;
        travelClass = req.body.class || 'Economy';

        // Check for pre-formatted detailedRequirements
        if (req.body.detailedRequirements) {
            // Use it as-is (legacy path)
        }
    }

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
    const totalTravellers = (adults || 0) + (children || 0) + (infants || 0);

    // Normalize trip type
    const normalizedTripType = (tripType || '').toLowerCase().replace(/[^a-z]/g, '');
    let finalTripType: 'one-way' | 'round-trip' | 'multi-city' = 'one-way';
    if (normalizedTripType.includes('round')) {
        finalTripType = 'round-trip';
    } else if (normalizedTripType.includes('multi')) {
        finalTripType = 'multi-city';
    }

    // ============================================================
    // BUILD DETAILED REQUIREMENTS IN THE EXACT FORMAT REQUESTED
    // Format differs by trip type:
    //   One-Way:    No leg prefix, no return
    //   Round-Trip: Departure + "Return" block
    //   Multi-City: Leg-1, Leg-2, Leg-3...
    // ============================================================
    let detailedRequirements = req.body.detailedRequirements || '';

    if (!detailedRequirements) {
        const tripLabel = finalTripType === 'multi-city' ? 'Multi-City' : 
                          finalTripType === 'round-trip' ? 'Round-Trip' : 'One-Way';
        
        let log = `Direct Booking Inquiry from Website\n\n`;
        log += `Trip Type: ${tripLabel}\n\n`;

        if (finalTripType === 'one-way') {
            // ONE-WAY FORMAT (no leg prefix)
            log += `flight from: ${flightFrom}  -->  Flight to: ${flightTo}\n`;
            log += `Travel Date: ${travelDate}\n\n`;

        } else if (finalTripType === 'round-trip') {
            // ROUND-TRIP FORMAT (departure + return block)
            log += `flight from: ${flightFrom}  -->  Flight to: ${flightTo}\n`;
            log += `Travel Date: ${travelDate}\n\n`;
            log += `Return\n`;
            log += `Flight from: ${flightTo} --> Flight to: ${flightFrom}\n`;
            log += `Travel Date : ${returnDate}\n\n`;

        } else {
            // MULTI-CITY FORMAT (Leg-1, Leg-2, Leg-3...)
            log += `Leg-1 flight from: ${flightFrom}  -->  Flight to: ${flightTo}\n`;
            log += `Travel Date: ${travelDate}\n\n`;

            for (let i = 0; i < additionalLegs.length; i++) {
                const legNum = i + 2;
                const leg = additionalLegs[i];
                log += `Leg-${legNum} Flight From: ${leg.from}  -->  Flight to: ${leg.to}\n`;
                log += `Travel Date: ${leg.date}\n\n`;
            }
        }

        log += `Class: ${travelClass}\n\n`;
        log += `Passenger Breakdown: ${adults} Adults, ${children} Children, ${infants} Infants`;

        detailedRequirements = log;
    }

    // Build segments array for database
    const segments: any[] = [];
    
    // Leg 1
    if (flightFrom || flightTo) {
        segments.push({
            from: flightFrom || '',
            to: flightTo || '',
            date: parseDate(travelDate)
        });
    }

    // Additional legs
    for (const leg of additionalLegs) {
        segments.push({
            from: leg.from || '',
            to: leg.to || '',
            date: parseDate(leg.date)
        });
    }

    // Also check legacy keys (flightFrom_2, flightFrom_3, etc.)
    const bodyKeys = Object.keys(req.body);
    for (let n = 2; n <= 10; n++) {
        const fk = bodyKeys.find(k => k === `flightFrom_${n}`);
        const tk = bodyKeys.find(k => k === `flightTo_${n}`);
        if (fk || tk) {
            const legFrom = req.body[fk || ''] || '';
            const legTo = req.body[tk || ''] || '';
            const legDate = req.body[`travelDate_${n}`] || '';
            const isDup = segments.some(s => s.from === legFrom && s.to === legTo);
            if (!isDup && (legFrom || legTo)) {
                segments.push({ from: legFrom, to: legTo, date: parseDate(legDate) });
            }
        }
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
        createdByUserId: websiteLeadUser._id,
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
