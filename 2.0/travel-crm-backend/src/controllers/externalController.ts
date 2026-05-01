import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking';
import Contact from '../models/Contact';
import Segment from '../models/Segment';
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
    const parseDate = (dateStr: any): string | null => {
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
        return (parsed && !isNaN(parsed.getTime())) ? parsed.toISOString() : null;
    };

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

    const additionalLegs: Array<{from: string; to: string; date: string}> = [];

    if (rawFields.length > 0) {
        for (const field of rawFields) {
            const label = (field.label || '').trim();
            const lLow = label.toLowerCase();
            const val = field.value;

            if (!val) continue;
            if (typeof val === 'string' && lLow.includes('submit')) continue;

            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                const rows: Record<string, Array<{pos: string; value: string}>> = {};
                for (const [k, v] of Object.entries(val)) {
                    let extractedVal = '';
                    if (typeof v === 'object' && v !== null && 'value' in v) {
                        extractedVal = String((v as any).value).trim();
                    } else if (typeof v === 'string') {
                        extractedVal = v.trim();
                    }
                    if (!extractedVal) continue;
                    
                    const match = k.match(/^(\d+\.\d+)_(\d+)$/);
                    if (match) {
                        const pos = match[1]; 
                        const rowIdx = match[2]; 
                        if (!rows[rowIdx]) rows[rowIdx] = [];
                        rows[rowIdx].push({ pos, value: extractedVal });
                    }
                }

                const sortedRowKeys = Object.keys(rows).sort((a, b) => Number(a) - Number(b));
                for (const rowIdx of sortedRowKeys) {
                    const rowFields = rows[rowIdx].sort((a, b) => a.pos.localeCompare(b.pos));
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
    }

    if (!contactNumber) {
        res.status(400);
        throw new Error('Contact number is required');
    }

    let finalName = contactPerson || 'Website Lead';
    if ((!contactPerson || contactPerson === 'Website Lead') && contactEmail) {
        const emailPart = contactEmail.split('@')[0];
        finalName = emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    const totalTravellers = (adults || 0) + (children || 0) + (infants || 0);
    const normalizedTripType = (tripType || '').toLowerCase().replace(/[^a-z]/g, '');
    let finalTripType: 'one-way' | 'round-trip' | 'multi-city' = 'one-way';
    if (normalizedTripType.includes('round')) {
        finalTripType = 'round-trip';
    } else if (normalizedTripType.includes('multi')) {
        finalTripType = 'multi-city';
    }

    let detailedRequirements = req.body.detailedRequirements || '';

    if (!detailedRequirements) {
        const tripLabel = finalTripType === 'multi-city' ? 'Multi-City' : 
                          finalTripType === 'round-trip' ? 'Round-Trip' : 'One-Way';
        
        let log = `Direct Booking Inquiry from Website\n\n`;
        log += `Trip Type: ${tripLabel}\n\n`;

        if (finalTripType === 'one-way') {
            log += `flight from: ${flightFrom}  -->  Flight to: ${flightTo}\n`;
            log += `Travel Date: ${travelDate}\n\n`;
        } else if (finalTripType === 'round-trip') {
            log += `flight from: ${flightFrom}  -->  Flight to: ${flightTo}\n`;
            log += `Travel Date: ${travelDate}\n\n`;
            log += `Return\n`;
            log += `Flight from: ${flightTo} --> Flight to: ${flightFrom}\n`;
            log += `Travel Date : ${returnDate}\n\n`;
        } else {
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

    const segmentsData: any[] = [];
    if (flightFrom || flightTo) {
        segmentsData.push({ from: flightFrom || '', to: flightTo || '', date: parseDate(travelDate) });
    }
    for (const leg of additionalLegs) {
        segmentsData.push({ from: leg.from || '', to: leg.to || '', date: parseDate(leg.date) });
    }

    const bodyKeys = Object.keys(req.body);
    for (let n = 2; n <= 10; n++) {
        const fk = bodyKeys.find(k => k === `flightFrom_${n}`);
        const tk = bodyKeys.find(k => k === `flightTo_${n}`);
        if (fk || tk) {
            const legFrom = req.body[fk || ''] || '';
            const legTo = req.body[tk || ''] || '';
            const legDate = req.body[`travelDate_${n}`] || '';
            const isDup = segmentsData.some(s => s.from === legFrom && s.to === legTo);
            if (!isDup && (legFrom || legTo)) {
                segmentsData.push({ from: legFrom, to: legTo, date: parseDate(legDate) });
            }
        }
    }

    const websiteLeadUser = await getWebsiteLeadUser();

    // 1. Create Contact
    const contact = await Contact.create({
        contactName: finalName,
        contactPhoneNo: contactNumber,
        contactEmail: contactEmail || null,
        bookingType: 'Direct (B2C)',
        requirements: detailedRequirements.trim() || null,
        status: 'Pending',
        assignedToUserId: null,
    });

    // 2. Create Booking
    const booking = await Booking.create({
        contactId: contact._id,
        tripType: finalTripType,
        createdByUserId: websiteLeadUser._id,
        assignedToUserId: null,
    });

    // 3. Create Segments
    if (segmentsData.length > 0) {
        const segmentDocs = segmentsData.map((s, idx) => ({
            bookingId: booking._id,
            legNumber: idx + 1,
            flightFrom: s.from,
            flightTo: s.to,
            departureTime: s.date
        }));
        await Segment.insertMany(segmentDocs);
    }

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
