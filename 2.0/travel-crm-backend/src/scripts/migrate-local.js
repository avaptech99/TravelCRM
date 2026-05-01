/**
 * CRM 2.0 Database Migration Script
 * Target: localhost:27017/travel_crm (LOCAL STAGING ONLY)
 * 
 * This script is IDEMPOTENT — safe to re-run.
 * Run with: node scripts/migrate-local.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'travel_crm';

async function migrate() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB:', MONGO_URI);
        const db = client.db(DB_NAME);

        // ═══════════════════════════════════════════════════════════
        // STEP 1: Copy primarycontacts → contacts
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 1: Copy primarycontacts → contacts ───');

        const contactsCount = await db.collection('contacts').countDocuments();
        if (contactsCount > 0) {
            console.log(`⏭️  Skipped — contacts already has ${contactsCount} documents`);
        } else {
            const primaryContacts = await db.collection('primarycontacts').find({}).toArray();
            console.log(`   Found ${primaryContacts.length} documents in primarycontacts`);

            if (primaryContacts.length > 0) {
                const contactDocs = primaryContacts.map(pc => ({
                    _id: pc._id,
                    contactName: pc.contactName || '',
                    contactPhoneNo: pc.contactPhoneNo || '',
                    contactEmail: pc.contactEmail || null,
                    bookingType: pc.bookingType || 'Direct (B2C)',
                    requirements: pc.requirements || null,
                    assignedGroup: null,
                    status: 'Pending',
                    interested: pc.interested || null,
                    assignedToUserId: null,
                    createdAt: pc.createdAt || new Date(),
                    updatedAt: pc.updatedAt || new Date(),
                }));

                await db.collection('contacts').insertMany(contactDocs);
                console.log(`✅ Inserted ${contactDocs.length} documents into contacts`);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Extract flight data from bookings → segments
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 2: Extract flight data → segments ───');

        const segmentsCount = await db.collection('segments').countDocuments();
        if (segmentsCount > 0) {
            console.log(`⏭️  Skipped — segments already has ${segmentsCount} documents`);
        } else {
            const bookingsWithFlights = await db.collection('bookings').find({
                $or: [
                    { flightFrom: { $exists: true, $ne: null } },
                    { flightTo: { $exists: true, $ne: null } },
                ],
            }).toArray();

            console.log(`   Found ${bookingsWithFlights.length} bookings with flight data`);

            const segmentDocs = [];
            for (const booking of bookingsWithFlights) {
                segmentDocs.push({
                    bookingId: booking._id,
                    legNumber: 1,
                    flightFrom: booking.flightFrom || null,
                    flightTo: booking.flightTo || null,
                    departureTime: booking.travelDate ? booking.travelDate.toISOString() : null,
                    arrivalTime: null,
                    returnDepartureTime: booking.returnDate ? booking.returnDate.toISOString() : null,
                    returnArrivalTime: null,
                });
            }

            if (segmentDocs.length > 0) {
                await db.collection('segments').insertMany(segmentDocs);
                console.log(`✅ Created ${segmentDocs.length} segment documents`);
            } else {
                console.log('   No flight data to migrate');
            }
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 3: Extract estimatedCosts + actualCosts → costs
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 3: Extract embedded costs → costs collection ───');

        const costsCount = await db.collection('costs').countDocuments();
        if (costsCount > 0) {
            console.log(`⏭️  Skipped — costs already has ${costsCount} documents`);
        } else {
            const bookingsWithCosts = await db.collection('bookings').find({
                $or: [
                    { estimatedCosts: { $exists: true, $not: { $size: 0 } } },
                    { actualCosts: { $exists: true, $not: { $size: 0 } } },
                ],
            }).toArray();

            console.log(`   Found ${bookingsWithCosts.length} bookings with cost data`);

            const costDocs = [];
            for (const booking of bookingsWithCosts) {
                if (booking.estimatedCosts && booking.estimatedCosts.length > 0) {
                    for (const c of booking.estimatedCosts) {
                        costDocs.push({
                            bookingId: booking._id,
                            costType: c.costType || c.type || 'Air Ticket',
                            price: c.price || 0,
                            supplierId: null,
                            costKind: 'estimated',
                            createdAt: new Date(),
                        });
                    }
                }
                if (booking.actualCosts && booking.actualCosts.length > 0) {
                    for (const c of booking.actualCosts) {
                        costDocs.push({
                            bookingId: booking._id,
                            costType: c.costType || c.type || 'Air Ticket',
                            price: c.price || 0,
                            supplierId: null,
                            costKind: 'actual',
                            createdAt: new Date(),
                        });
                    }
                }
            }

            if (costDocs.length > 0) {
                await db.collection('costs').insertMany(costDocs);
                console.log(`✅ Created ${costDocs.length} cost documents`);
            } else {
                console.log('   No cost data to migrate');
            }
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 4: Rename primaryContactId → contactId on bookings
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 4: Rename primaryContactId → contactId ───');

        const hasOldField = await db.collection('bookings').countDocuments({ primaryContactId: { $exists: true } });
        if (hasOldField > 0) {
            const renameResult = await db.collection('bookings').updateMany(
                { primaryContactId: { $exists: true } },
                [{ $set: { contactId: '$primaryContactId' } }]
            );
            console.log(`   Copied primaryContactId → contactId on ${renameResult.modifiedCount} documents`);

            const unsetResult = await db.collection('bookings').updateMany(
                {},
                { $unset: { primaryContactId: '' } }
            );
            console.log(`✅ Removed old primaryContactId field from ${unsetResult.modifiedCount} documents`);
        } else {
            console.log('⏭️  Skipped — primaryContactId already renamed or missing');
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 5: Copy totalAmount/amount → lumpSumAmount BEFORE unsetting
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 5: Copy financial data to lumpSumAmount ───');
        
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

        const withLumpSum = await db.collection('bookings').countDocuments({ lumpSumAmount: { $gt: 0 } });
        console.log(`✅ STEP 5 PASSED: ${withLumpSum} bookings now have lumpSumAmount > 0`);

        // ═══════════════════════════════════════════════════════════
        // STEP 6: Strip removed fields from bookings
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 6: Strip removed fields from bookings ───');

        const fieldsToRemove = {
            flightFrom: '',
            flightTo: '',
            travelDate: '',
            returnDate: '',
            destination: '',
            tripType: '',   
            segments: '',
            status: '',
            assignedGroup: '',
            estimatedCosts: '',
            actualCosts: '',
            travellers: '',
            amount: '',
            pricePerTicket: '',
        };

        // Check if any booking still has old fields
        const hasOldBookingFields = await db.collection('bookings').countDocuments({
            $or: Object.keys(fieldsToRemove).map(f => ({ [f]: { $exists: true } })),
        });

        if (hasOldBookingFields > 0) {
            const stripResult = await db.collection('bookings').updateMany(
                {},
                { $unset: fieldsToRemove }
            );
            console.log(`✅ Stripped ${Object.keys(fieldsToRemove).length} old fields from ${stripResult.modifiedCount} bookings`);
        } else {
            console.log('⏭️  Skipped — old fields already removed from bookings');
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 6: Strip flight fields from passengers
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 6: Strip flight fields from passengers ───');

        const passengerFlightFields = {
            flightFrom: '',
            flightTo: '',
            departureTime: '',
            arrivalTime: '',
            tripType: '',
            returnDate: '',
            returnDepartureTime: '',
            returnArrivalTime: '',
        };

        const hasOldPassengerFields = await db.collection('passengers').countDocuments({
            $or: Object.keys(passengerFlightFields).map(f => ({ [f]: { $exists: true } })),
        });

        if (hasOldPassengerFields > 0) {
            const passengerResult = await db.collection('passengers').updateMany(
                {},
                { $unset: passengerFlightFields }
            );
            console.log(`✅ Stripped flight fields from ${passengerResult.modifiedCount} passengers`);
        } else {
            console.log('⏭️  Skipped — flight fields already removed from passengers');
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 7: Add contactId to comments
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 7: Backfill contactId on comments ───');

        const commentsWithoutContact = await db.collection('comments').find({
            bookingId: { $exists: true, $ne: null },
            contactId: { $exists: false },
        }).toArray();

        if (commentsWithoutContact.length > 0) {
            let updated = 0;
            for (const comment of commentsWithoutContact) {
                const booking = await db.collection('bookings').findOne({ _id: comment.bookingId });
                if (booking && booking.contactId) {
                    await db.collection('comments').updateOne(
                        { _id: comment._id },
                        { $set: { contactId: booking.contactId } }
                    );
                    updated++;
                }
            }
            console.log(`✅ Added contactId to ${updated} comments`);
        } else {
            console.log('⏭️  Skipped — comments already have contactId or none exist');
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 8: Drop unused collections
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 8: Drop unused collections ───');

        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (collectionNames.includes('travelers')) {
            const travelerCount = await db.collection('travelers').countDocuments();
            if (travelerCount === 0) {
                await db.collection('travelers').drop();
                console.log('✅ Dropped travelers collection (was empty)');
            } else {
                console.log(`⚠️  Travelers has ${travelerCount} documents — NOT dropping (manual review needed)`);
            }
        } else {
            console.log('⏭️  travelers collection does not exist');
        }

        if (collectionNames.includes('missedcalls')) {
            const missedCount = await db.collection('missedcalls').countDocuments();
            if (missedCount === 0) {
                await db.collection('missedcalls').drop();
                console.log('✅ Dropped missedcalls collection (was empty)');
            } else {
                console.log(`⚠️  missedcalls has ${missedCount} documents — NOT dropping`);
            }
        } else {
            console.log('⏭️  missedcalls collection does not exist');
        }

        console.log('   ℹ️  Keeping notifications and activities as-is');

        // ═══════════════════════════════════════════════════════════
        // STEP 9: Create indexes
        // ═══════════════════════════════════════════════════════════
        console.log('\n─── STEP 9: Create indexes ───');

        // contacts
        await db.collection('contacts').createIndex({ contactPhoneNo: 1 });
        await db.collection('contacts').createIndex({ status: 1, assignedGroup: 1, assignedToUserId: 1, createdAt: -1 });
        await db.collection('contacts').createIndex({ assignedToUserId: 1, createdAt: -1 });
        await db.collection('contacts').createIndex({ createdAt: -1 });
        console.log('✅ contacts indexes created');

        // bookings
        await db.collection('bookings').createIndex({ uniqueCode: 1 }, { unique: true });
        await db.collection('bookings').createIndex({ contactId: 1, createdAt: -1 });
        await db.collection('bookings').createIndex({ assignedToUserId: 1, createdAt: -1 });
        await db.collection('bookings').createIndex({ verified: 1, createdAt: -1 });
        console.log('✅ bookings indexes created');

        // child collections
        await db.collection('segments').createIndex({ bookingId: 1, legNumber: 1 });
        await db.collection('passengers').createIndex({ bookingId: 1 });
        await db.collection('costs').createIndex({ bookingId: 1, costKind: 1 });
        await db.collection('payments').createIndex({ bookingId: 1 });
        await db.collection('comments').createIndex({ bookingId: 1, createdAt: -1 });
        await db.collection('comments').createIndex({ contactId: 1, createdAt: -1 });
        console.log('✅ child collection indexes created');

        // lookup collections
        await db.collection('suppliers').createIndex({ category: 1, name: 1 });
        console.log('✅ supplier indexes created');

        // ═══════════════════════════════════════════════════════════
        // VERIFICATION REPORT
        // ═══════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('           MIGRATION VERIFICATION REPORT');
        console.log('═══════════════════════════════════════════════════════\n');

        const report = {
            contacts: await db.collection('contacts').countDocuments(),
            bookings: await db.collection('bookings').countDocuments(),
            segments: await db.collection('segments').countDocuments(),
            passengers: await db.collection('passengers').countDocuments(),
            costs: await db.collection('costs').countDocuments(),
            payments: await db.collection('payments').countDocuments(),
            comments: await db.collection('comments').countDocuments(),
            suppliers: await db.collection('suppliers').countDocuments(),
            users: await db.collection('users').countDocuments(),
            activities: await db.collection('activities').countDocuments(),
        };

        console.log('Document counts:');
        for (const [collection, count] of Object.entries(report)) {
            console.log(`   ${collection.padEnd(15)} ${count}`);
        }

        // Check for stale fields
        const staleBookings = await db.collection('bookings').countDocuments({
            $or: [
                { flightFrom: { $exists: true } },
                { status: { $exists: true } },
                { estimatedCosts: { $exists: true } },
                { primaryContactId: { $exists: true } },
            ],
        });
        console.log(`\n   Bookings with OLD fields remaining: ${staleBookings}`);

        const stalePassengers = await db.collection('passengers').countDocuments({
            flightFrom: { $exists: true },
        });
        console.log(`   Passengers with OLD flight fields:  ${stalePassengers}`);

        if (staleBookings === 0 && stalePassengers === 0) {
            console.log('\n✅ ✅ ✅  MIGRATION COMPLETE — ALL CLEAN  ✅ ✅ ✅');
        } else {
            console.log('\n⚠️  Some old fields remain — check data manually');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.close();
        console.log('\n🔒 Connection closed');
    }
}

migrate();
