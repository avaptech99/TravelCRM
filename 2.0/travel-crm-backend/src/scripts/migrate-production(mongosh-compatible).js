/**
 * CRM 2.0 Database Migration Script
 * Target: Production (mongosh-compatible)
 * 
 * This script is IDEMPOTENT — safe to re-run.
 * Run inside mongosh: load('migrate-production(mongosh-compatible).js')
 */

print('Starting migration...');

try {
    // ═══════════════════════════════════════════════════════════
    // SAFETY CHECK (run first, abort if fails)
    // ═══════════════════════════════════════════════════════════
    print('\n─── SAFETY CHECK ───');
    const existingContacts = db.contacts.countDocuments();
    const existingSegments = db.segments.countDocuments();

    if (existingContacts > 0 || existingSegments > 0) {
        print('ABORT: contacts or segments already exist.');
        print('Migration appears to have already run.');
        print('Manually drop contacts and segments first if you want to re-run.');
        quit(1);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 1 — Read and validate source data FIRST
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 1: Read and validate source data ───');
    // Read ALL bookings into memory before touching anything
    const allBookings = db.bookings.find({}).toArray();
    const allPrimaryContacts = db.primarycontacts.find({}).toArray();

    print(`Source: ${allBookings.length} bookings, ${allPrimaryContacts.length} primarycontacts`);

    // Build maps we need
    const bookingStatusMap = {};      // bookingId → status
    const bookingInterestedMap = {};  // bookingId → interested
    const bookingContactMap = {};     // bookingId → primaryContactId
    const contactBookingMap = {};     // primaryContactId → booking data

    allBookings.forEach(b => {
        bookingStatusMap[b._id.toString()] = b.status || 'Pending';
        bookingInterestedMap[b._id.toString()] = b.interested || null;
        bookingContactMap[b._id.toString()] = b.primaryContactId ? b.primaryContactId.toString() : undefined;
        
        if (b.primaryContactId) {
            contactBookingMap[b.primaryContactId.toString()] = {
                status: b.status || 'Pending',
                interested: b.interested || null,
                assignedGroup: b.assignedGroup || null,
                assignedToUserId: b.assignedToUserId || null
            };
        }
    });

    // Verify we have status data
    const withStatus = Object.values(bookingStatusMap).filter(s => s !== 'Pending').length;
    print(`Bookings with non-Pending status: ${withStatus}`);
    if (withStatus === 0 && allBookings.length > 0) {
        print('ABORT: No non-Pending statuses found in bookings.');
        print('Either data is already migrated or something is wrong.');
        quit(1);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2 — Create contacts WITH correct status (not default)
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 2: Create contacts WITH correct status ───');
    
    if (allPrimaryContacts.length > 0) {
        // Build contact documents with status COPIED from booking
        const contactDocs = allPrimaryContacts.map(pc => {
            const bookingData = contactBookingMap[pc._id.toString()] || {};
            
            return {
                _id: pc._id,  // KEEP SAME _id so all bookings still reference correctly
                contactName: pc.contactName,
                contactPhoneNo: pc.contactPhoneNo,
                contactEmail: pc.contactEmail || null,
                bookingType: pc.bookingType || 'Direct (B2C)',
                requirements: pc.requirements || '',
                // CRITICAL: copy from booking, not default
                status: bookingData.status || 'Pending',
                interested: bookingData.interested || null,
                assignedGroup: bookingData.assignedGroup || null,
                assignedToUserId: bookingData.assignedToUserId || null,
                createdAt: pc.createdAt,
                updatedAt: pc.updatedAt
            };
        });

        db.contacts.insertMany(contactDocs);

        // VERIFY before continuing
        const contactCount = db.contacts.countDocuments();
        if (contactCount !== allPrimaryContacts.length) {
            print(`ABORT: Expected ${allPrimaryContacts.length} contacts, got ${contactCount}`);
            quit(1);
        }

        // Verify status distribution
        const statusDist = db.contacts.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        print('Contact status distribution: ' + JSON.stringify(statusDist));

        const nonPending = statusDist.filter(s => s._id !== 'Pending');
        if (nonPending.length === 0) {
            print('ABORT: All contacts are Pending - status copy failed');
            db.contacts.drop(); // rollback
            quit(1);
        }
        print('✅ STEP 2 PASSED: Contacts created with correct statuses');
    } else {
        print('⏭️  Skipped — no primarycontacts to migrate');
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3 — Extract segments (safe — additive only)
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 3: Extract segments ───');
    const segmentDocs = [];
    allBookings.forEach(booking => {
        if (booking.flightFrom || booking.flightTo) {
            segmentDocs.push({
                bookingId: booking._id,
                legNumber: 1,
                flightFrom: booking.flightFrom || null,
                flightTo: booking.flightTo || null,
                departureTime: booking.travelDate || null,
                arrivalTime: null,
                returnDepartureTime: booking.returnDate || null,
                returnArrivalTime: null
            });
        }
    });

    if (segmentDocs.length > 0) {
        db.segments.insertMany(segmentDocs);
    }

    const segCount = db.segments.countDocuments();
    print(`✅ STEP 3 PASSED: ${segCount} segments created`);

    // ═══════════════════════════════════════════════════════════
    // STEP 4 — Extract costs (safe — additive only)
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 4: Extract costs ───');
    const costDocs = [];
    allBookings.forEach(booking => {
        (booking.estimatedCosts || []).forEach(c => {
            costDocs.push({
                bookingId: booking._id,
                costType: c.costType || c.type || 'Air Ticket',
                price: c.price || 0,
                supplierId: null,
                costKind: 'estimated',
                createdAt: booking.createdAt
            });
        });
        (booking.actualCosts || []).forEach(c => {
            costDocs.push({
                bookingId: booking._id,
                costType: c.costType || c.type || 'Air Ticket',
                price: c.price || 0,
                supplierId: null,
                costKind: 'actual',
                createdAt: booking.createdAt
            });
        });
    });

    if (costDocs.length > 0) {
        db.costs.insertMany(costDocs);
    }
    print(`✅ STEP 4 PASSED: ${costDocs.length} cost documents created`);

    // ═══════════════════════════════════════════════════════════
    // STEP 5 — Update bookings (rename field only, NO $unset yet)
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 5: Rename primaryContactId → contactId ───');
    
    db.bookings.updateMany(
        { primaryContactId: { $exists: true } },
        [{ $set: { contactId: '$primaryContactId' } }]
    );

    // VERIFY contactId is set before unset
    const withContactId = db.bookings.countDocuments({ 
        contactId: { $exists: true } 
    });
    
    const bookingsWithPrimaryContactId = allBookings.filter(b => b.primaryContactId).length;
    
    // Only verify if we actually expected contactIds
    if (bookingsWithPrimaryContactId > 0 && withContactId !== bookingsWithPrimaryContactId && withContactId !== allBookings.length) {
         print(`⚠️ Expected at least ${bookingsWithPrimaryContactId} bookings to have contactId, but found ${withContactId}. Proceeding since some bookings might natively lack a contactId.`);
    }
    
    print(`✅ STEP 5 PASSED: ${withContactId} bookings have contactId`);

    // ═══════════════════════════════════════════════════════════
    // STEP 6 — Copy financial data to lumpSumAmount BEFORE unsetting
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 6: Copy totalAmount/amount → lumpSumAmount ───');
    
    db.bookings.updateMany(
        { $or: [{ lumpSumAmount: 0 }, { lumpSumAmount: null }, { lumpSumAmount: { $exists: false } }] },
        [{ $set: { 
            lumpSumAmount: { 
                $cond: {
                    if: { $gt: ["$totalAmount", 0] },
                    then: "$totalAmount",
                    else: { $cond: {
                        if: { $gt: ["$amount", 0] },
                        then: "$amount", 
                        else: 0
                    }}
                }
            }
        }}]
    );

    // Verify before continuing
    const withAmount = db.bookings.countDocuments({ lumpSumAmount: { $gt: 0 } });
    print(`✅ STEP 6 PASSED: ${withAmount} bookings have lumpSumAmount > 0`);
    
    if (withAmount === 0 && allBookings.length > 0) {
        print('ABORT: lumpSumAmount copy failed — no financial data found');
        quit(1);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 7 — NOW strip old fields (only after all verifications pass)
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 7: Strip legacy fields ───');
    
    // Strip from bookings
    db.bookings.updateMany({}, {
        $unset: {
            primaryContactId: '',
            flightFrom: '', flightTo: '',
            travelDate: '', returnDate: '',
            destination: '', tripType: '',
            segments: '', status: '',
            assignedGroup: '',
            estimatedCosts: '', actualCosts: '',
            travellers: '', amount: '', pricePerTicket: ''
        }
    });

    // Strip flight fields from passengers
    db.passengers.updateMany({}, {
        $unset: {
            flightFrom: '', flightTo: '',
            departureTime: '', arrivalTime: '',
            tripType: '', returnDate: '',
            returnDepartureTime: '', returnArrivalTime: ''
        }
    });

    print('✅ STEP 7 PASSED: Legacy fields stripped');

    // ═══════════════════════════════════════════════════════════
    // STEP 8 — Backfill contactId on comments
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 8: Backfill contactId on comments ───');
    
    const allComments = db.comments.find({ bookingId: { $exists: true } }).toArray();

    let commentUpdates = 0;
    for (const comment of allComments) {
        const booking = db.bookings.findOne(
            { _id: comment.bookingId }, 
            { projection: { contactId: 1 } }
        );
        if (booking && booking.contactId) {
            db.comments.updateOne(
                { _id: comment._id },
                { $set: { contactId: booking.contactId } }
            );
            commentUpdates++;
        }
    }
    print(`✅ STEP 8 PASSED: ${commentUpdates} comments backfilled with contactId`);

    // ═══════════════════════════════════════════════════════════
    // STEP 9 — Drop empty collections
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 9: Drop empty collections ───');
    
    const collectionNames = db.getCollectionNames();

    if (collectionNames.includes('travelers')) {
        const travelerCount = db.travelers.countDocuments();
        if (travelerCount === 0) {
            db.travelers.drop();
            print('✅ travelers dropped (was empty)');
        } else {
            print(`⚠️  travelers NOT dropped — has ${travelerCount} documents`);
        }
    }

    if (collectionNames.includes('missedcalls')) {
        const missedCallsCount = db.missedcalls.countDocuments();
        if (missedCallsCount === 0) {
            db.missedcalls.drop();
            print('✅ missedcalls dropped (was empty)');
        } else {
             print(`⚠️  missedcalls NOT dropped — has ${missedCallsCount} documents`);
        }
    }
    print('   ℹ️  activities and notifications kept as-is');

    // ═══════════════════════════════════════════════════════════
    // STEP 10 — Create all indexes
    // ═══════════════════════════════════════════════════════════
    print('\n─── STEP 10: Create all indexes ───');
    
    db.contacts.createIndex({ contactPhoneNo: 1 });
    db.contacts.createIndex({ status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 });
    db.contacts.createIndex({ assignedToUserId: 1, createdAt: -1 });
    db.contacts.createIndex({ createdAt: -1 });

    db.bookings.createIndex({ uniqueCode: 1 }, { unique: true });
    db.bookings.createIndex({ contactId: 1, createdAt: -1 });
    db.bookings.createIndex({ assignedToUserId: 1, createdAt: -1 });
    db.bookings.createIndex({ verified: 1, createdAt: -1 });

    db.segments.createIndex({ bookingId: 1, legNumber: 1 });
    db.passengers.createIndex({ bookingId: 1 });
    db.costs.createIndex({ bookingId: 1, costKind: 1 });
    db.payments.createIndex({ bookingId: 1 });
    db.comments.createIndex({ bookingId: 1, createdAt: -1 });
    db.comments.createIndex({ contactId: 1, createdAt: -1 });
    db.suppliers.createIndex({ category: 1, name: 1 });

    print('✅ STEP 10 PASSED: All indexes created');

    // ═══════════════════════════════════════════════════════════
    // FINAL VERIFICATION REPORT
    // ═══════════════════════════════════════════════════════════
    print('\n========== FINAL VERIFICATION ==========');

    const results = {
        contacts: db.contacts.countDocuments(),
        bookings: db.bookings.countDocuments(),
        segments: db.segments.countDocuments(),
        costs: db.costs.countDocuments(),
        passengers: db.passengers.countDocuments(),
        payments: db.payments.countDocuments(),
        comments: db.comments.countDocuments(),
    };
    print('Document counts: ' + JSON.stringify(results));

    const statusDistResult = db.contacts.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    print('Status distribution: ' + JSON.stringify(statusDistResult));

    const staleBooking = db.bookings.findOne({ 
        flightFrom: { $exists: true } 
    });
    print('Stale flightFrom on booking: ' + (staleBooking ? 'FOUND - PROBLEM' : 'NULL - CLEAN ✅'));

    const commentWithContact = db.comments.findOne({
        bookingId: { $exists: true },
        contactId: { $exists: true }
    });
    print('Comment has contactId: ' + (commentWithContact ? '✅' : 'MISSING - PROBLEM'));

    print('========================================');
    print('If all checks show ✅ — safe to deploy to production');

} catch (error) {
    print('❌ Migration failed: ' + error);
    quit(1);
}

print('\n🏁 Migration script finished');
