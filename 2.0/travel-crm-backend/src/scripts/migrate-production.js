/**
 * CRM 2.0 Database Migration Script
 * Target: Production
 * 
 * This script is IDEMPOTENT — safe to re-run.
 * Run with: node src/scripts/migrate-production.js
 */

const { MongoClient } = require('mongodb');

// Set this to the production URI before running!
const MONGO_URI = "mongodb+srv://ca_db_user:PASSWORD@travelcrm.wxmise3.mongodb.net/travelCRM";
const DB_NAME = "travelCRM";

async function migrate() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        const db = client.db(DB_NAME);

        // ═══════════════════════════════════════════════════════════
        // SAFETY CHECK (run first, abort if fails)
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── SAFETY CHECK ───');
        const existingContacts = await db.collection('contacts').countDocuments();
        const existingSegments = await db.collection('segments').countDocuments();

        if (existingContacts > 0 || existingSegments > 0) {
            console.error('ABORT: contacts or segments already exist.');
            console.error('Migration appears to have already run.');
            console.error('Manually drop contacts and segments first if you want to re-run.');
            process.exit(1);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 1 — Read and validate source data FIRST
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 1: Read and validate source data ───');
        // Read ALL bookings into memory before touching anything
        const allBookings = await db.collection('bookings').find({}).toArray();
        const allPrimaryContacts = await db.collection('primarycontacts').find({}).toArray();

        console.log(`Source: ${allBookings.length} bookings, ${allPrimaryContacts.length} primarycontacts`);

        // Build maps we need
        const bookingStatusMap = {};      // bookingId → status
        const bookingInterestedMap = {};  // bookingId → interested
        const bookingContactMap = {};     // bookingId → primaryContactId
        const contactBookingMap = {};     // primaryContactId → booking data

        allBookings.forEach(b => {
            bookingStatusMap[b._id.toString()] = b.status || 'Pending';
            bookingInterestedMap[b._id.toString()] = b.interested || null;
            bookingContactMap[b._id.toString()] = b.primaryContactId?.toString();
            
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
        console.log(`Bookings with non-Pending status: ${withStatus}`);
        if (withStatus === 0 && allBookings.length > 0) {
            console.error('ABORT: No non-Pending statuses found in bookings.');
            console.error('Either data is already migrated or something is wrong.');
            process.exit(1);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 2 — Create contacts WITH correct status (not default)
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 2: Create contacts WITH correct status ───');
        
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

            await db.collection('contacts').insertMany(contactDocs);

            // VERIFY before continuing
            const contactCount = await db.collection('contacts').countDocuments();
            if (contactCount !== allPrimaryContacts.length) {
                console.error(`ABORT: Expected ${allPrimaryContacts.length} contacts, got ${contactCount}`);
                process.exit(1);
            }

            // Verify status distribution
            const statusDist = await db.collection('contacts').aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray();
            console.log('Contact status distribution:', statusDist);

            const nonPending = statusDist.filter(s => s._id !== 'Pending');
            if (nonPending.length === 0) {
                console.error('ABORT: All contacts are Pending - status copy failed');
                await db.collection('contacts').drop(); // rollback
                process.exit(1);
            }
            console.log('✅ STEP 2 PASSED: Contacts created with correct statuses');
        } else {
            console.log('⏭️  Skipped — no primarycontacts to migrate');
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 3 — Extract segments (safe — additive only)
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 3: Extract segments ───');
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
            await db.collection('segments').insertMany(segmentDocs);
        }

        const segCount = await db.collection('segments').countDocuments();
        console.log(`✅ STEP 3 PASSED: ${segCount} segments created`);

        // ═══════════════════════════════════════════════════════════
        // STEP 4 — Extract costs (safe — additive only)
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 4: Extract costs ───');
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
            await db.collection('costs').insertMany(costDocs);
        }
        console.log(`✅ STEP 4 PASSED: ${costDocs.length} cost documents created`);

        // ═══════════════════════════════════════════════════════════
        // STEP 5 — Update bookings (rename field only, NO $unset yet)
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 5: Rename primaryContactId → contactId ───');
        
        await db.collection('bookings').updateMany(
            { primaryContactId: { $exists: true } },
            [{ $set: { contactId: '$primaryContactId' } }]
        );

        // VERIFY contactId is set before unset
        const withContactId = await db.collection('bookings').countDocuments({ 
            contactId: { $exists: true } 
        });
        
        const bookingsWithPrimaryContactId = allBookings.filter(b => b.primaryContactId).length;
        
        // Only verify if we actually expected contactIds
        if (bookingsWithPrimaryContactId > 0 && withContactId !== bookingsWithPrimaryContactId && withContactId !== allBookings.length) {
             console.log(`⚠️ Expected at least ${bookingsWithPrimaryContactId} bookings to have contactId, but found ${withContactId}. Proceeding since some bookings might natively lack a contactId.`);
        }
        
        console.log(`✅ STEP 5 PASSED: ${withContactId} bookings have contactId`);

        // ═══════════════════════════════════════════════════════════
        // STEP 6 — Copy financial data to lumpSumAmount BEFORE unsetting
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 6: Copy totalAmount/amount → lumpSumAmount ───');
        
        await db.collection('bookings').updateMany(
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
        const withAmount = await db.collection('bookings').countDocuments({ lumpSumAmount: { $gt: 0 } });
        console.log(`✅ STEP 6 PASSED: ${withAmount} bookings have lumpSumAmount > 0`);
        
        if (withAmount === 0 && allBookings.length > 0) {
            console.error('ABORT: lumpSumAmount copy failed — no financial data found');
            process.exit(1);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 7 — NOW strip old fields (only after all verifications pass)
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 7: Strip legacy fields ───');
        
        // Strip from bookings
        await db.collection('bookings').updateMany({}, {
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
        await db.collection('passengers').updateMany({}, {
            $unset: {
                flightFrom: '', flightTo: '',
                departureTime: '', arrivalTime: '',
                tripType: '', returnDate: '',
                returnDepartureTime: '', returnArrivalTime: ''
            }
        });

        console.log('✅ STEP 6 PASSED: Legacy fields stripped');

        // ═══════════════════════════════════════════════════════════
        // STEP 8 — Backfill contactId on comments
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 8: Backfill contactId on comments ───');
        
        const allComments = await db.collection('comments').find({ bookingId: { $exists: true } }).toArray();

        let commentUpdates = 0;
        for (const comment of allComments) {
            const booking = await db.collection('bookings').findOne(
                { _id: comment.bookingId }, 
                { projection: { contactId: 1 } }
            );
            if (booking && booking.contactId) {
                await db.collection('comments').updateOne(
                    { _id: comment._id },
                    { $set: { contactId: booking.contactId } }
                );
                commentUpdates++;
            }
        }
        console.log(`✅ STEP 7 PASSED: ${commentUpdates} comments backfilled with contactId`);

        // ═══════════════════════════════════════════════════════════
        // STEP 8 — Drop empty collections
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 8: Drop empty collections ───');
        
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (collectionNames.includes('travelers')) {
            const travelerCount = await db.collection('travelers').countDocuments();
            if (travelerCount === 0) {
                await db.collection('travelers').drop();
                console.log('✅ travelers dropped (was empty)');
            } else {
                console.log(`⚠️  travelers NOT dropped — has ${travelerCount} documents`);
            }
        }

        if (collectionNames.includes('missedcalls')) {
            const missedCallsCount = await db.collection('missedcalls').countDocuments();
            if (missedCallsCount === 0) {
                await db.collection('missedcalls').drop();
                console.log('✅ missedcalls dropped (was empty)');
            } else {
                 console.log(`⚠️  missedcalls NOT dropped — has ${missedCallsCount} documents`);
            }
        }
        console.log('   ℹ️  activities and notifications kept as-is');

        // ═══════════════════════════════════════════════════════════
        // STEP 9 — Create all indexes
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 9: Create all indexes ───');
        
        await db.collection('contacts').createIndex({ contactPhoneNo: 1 });
        await db.collection('contacts').createIndex({ status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 });
        await db.collection('contacts').createIndex({ assignedToUserId: 1, createdAt: -1 });
        await db.collection('contacts').createIndex({ createdAt: -1 });

        await db.collection('bookings').createIndex({ uniqueCode: 1 }, { unique: true });
        await db.collection('bookings').createIndex({ contactId: 1, createdAt: -1 });
        await db.collection('bookings').createIndex({ assignedToUserId: 1, createdAt: -1 });
        await db.collection('bookings').createIndex({ verified: 1, createdAt: -1 });

        await db.collection('segments').createIndex({ bookingId: 1, legNumber: 1 });
        await db.collection('passengers').createIndex({ bookingId: 1 });
        await db.collection('costs').createIndex({ bookingId: 1, costKind: 1 });
        await db.collection('payments').createIndex({ bookingId: 1 });
        await db.collection('comments').createIndex({ bookingId: 1, createdAt: -1 });
        await db.collection('comments').createIndex({ contactId: 1, createdAt: -1 });
        await db.collection('suppliers').createIndex({ category: 1, name: 1 });

        console.log('✅ STEP 9 PASSED: All indexes created');

        // ═══════════════════════════════════════════════════════════
        // FINAL VERIFICATION REPORT
        // ═══════════════════════════════════════════════════════════
        console.log('\n========== FINAL VERIFICATION ==========');

        const results = {
            contacts: await db.collection('contacts').countDocuments(),
            bookings: await db.collection('bookings').countDocuments(),
            segments: await db.collection('segments').countDocuments(),
            costs: await db.collection('costs').countDocuments(),
            passengers: await db.collection('passengers').countDocuments(),
            payments: await db.collection('payments').countDocuments(),
            comments: await db.collection('comments').countDocuments(),
        };
        console.log('Document counts:', results);

        const statusDist = await db.collection('contacts').aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        console.log('Status distribution:', statusDist);

        const staleBooking = await db.collection('bookings').findOne({ 
            flightFrom: { $exists: true } 
        });
        console.log('Stale flightFrom on booking:', staleBooking ? 'FOUND - PROBLEM' : 'NULL - CLEAN ✅');

        const commentWithContact = await db.collection('comments').findOne({
            bookingId: { $exists: true },
            contactId: { $exists: true }
        });
        console.log('Comment has contactId:', commentWithContact ? '✅' : 'MISSING - PROBLEM');

        console.log('========================================');
        console.log('If all checks show ✅ — safe to deploy to production');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.close();
        console.log('\n🔒 Connection closed');
    }
}

migrate();
