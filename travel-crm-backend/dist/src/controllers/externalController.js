"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExternalLead = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Booking_1 = __importDefault(require("../models/Booking"));
const PrimaryContact_1 = __importDefault(require("../models/PrimaryContact"));
const User_1 = __importDefault(require("../models/User"));
const cache_1 = __importDefault(require("../utils/cache"));
// Helper: Find or create a system user named "Website Lead"
const getWebsiteLeadUser = async () => {
    let user = await User_1.default.findOne({ email: 'website-lead@system.internal' });
    if (!user) {
        // Create a system user (no real password, cannot login)
        user = await User_1.default.create({
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
exports.createExternalLead = (0, express_async_handler_1.default)(async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
        res.status(401);
        throw new Error('Unauthorized: Invalid API Key');
    }
    const { contactPerson, contactNumber, contactEmail, flightFrom, flightTo, travelDate, travellers, tripType, requirements, adults, children, infants, class: travelClass } = req.body;
    if (!contactNumber) {
        res.status(400);
        throw new Error('Contact number is required');
    }
    // Extract name from email if contactPerson not provided
    let finalName = contactPerson || 'Website Lead';
    if ((!contactPerson || contactPerson === 'Website Lead') && contactEmail) {
        const emailPart = contactEmail.split('@')[0];
        finalName = emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    // Calculate total travellers
    let totalTravellers = 0;
    if (adults || children || infants) {
        totalTravellers = (Number(adults) || 0) + (Number(children) || 0) + (Number(infants) || 0);
    }
    else if (typeof travellers === 'number') {
        totalTravellers = travellers;
    }
    // Prepare requirements summary
    let detailedRequirements = requirements || '';
    if (travelClass)
        detailedRequirements += `\nClass: ${travelClass}`;
    if (adults || children || infants) {
        detailedRequirements += `\nBreakdown: ${adults || 0} Adults, ${children || 0} Children, ${infants || 0} Infants`;
    }
    if (tripType === 'multi-city') {
        detailedRequirements += `\nTrip Type: Multi City`;
    }
    // Get "Website Lead" system user so Created By shows "Website Lead"
    const websiteLeadUser = await getWebsiteLeadUser();
    // 1. Create PrimaryContact
    const primaryContact = await PrimaryContact_1.default.create({
        contactName: finalName,
        contactPhoneNo: contactNumber,
        contactEmail: contactEmail || null,
        bookingType: 'Direct (B2C)',
        requirements: detailedRequirements.trim() || null,
    });
    // 2. Create Booking (status defaults to "Pending", createdAt is automatic)
    const booking = await Booking_1.default.create({
        destination: flightTo || null,
        travelDate: travelDate ? new Date(travelDate) : null,
        flightFrom: flightFrom || null,
        flightTo: flightTo || null,
        tripType: (tripType === 'round-trip') ? 'round-trip' : 'one-way',
        travellers: totalTravellers || null,
        primaryContactId: primaryContact._id,
        createdByUserId: websiteLeadUser._id, // Shows "Website Lead" in Created By
        assignedToUserId: null,
    });
    // Invalidate caches
    cache_1.default.invalidateByPrefix('bookings_');
    cache_1.default.invalidateByPrefix('stats_');
    cache_1.default.invalidateByPrefix('recent_');
    res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        bookingId: booking._id,
        uniqueCode: booking.uniqueCode
    });
});
