/**
 * CRM 3.0 — Migration Script: Backfill segments[] from legacy flat fields
 * 
 * Usage:
 *   node migrateToSegments.js                 # Dry-run (no writes)
 *   node migrateToSegments.js --apply         # Actually write changes
 * 
 * Connects to the MONGO_URI from .env or falls back to localhost.
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Try to load dotenv
try { require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); } catch (e) {}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/CRM3';
const DRY_RUN = !process.argv.includes('--apply');

async function main() {
    console.log(`\n=== CRM 3.0 Segments Migration ===`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY-RUN (no writes)' : '🔥 APPLY (writing changes)'}`);
    console.log(`URI: ${MONGO_URI.replace(/\/\/.*@/, '//***@')}\n`);

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();

    const bookings = db.collection('bookings');
    const passengers = db.collection('passengers');

    // ── Step 1: Backfill segments from root-level legacy fields ──
    const allBookings = await bookings.find({}).toArray();
    console.log(`Total bookings: ${allBookings.length}`);

    let backfilled = 0;
    let amountSynced = 0;
    let alreadyHasSegments = 0;
    let noData = 0;

    for (const b of allBookings) {
        const hasSegments = b.segments && b.segments.length > 0 && b.segments.some(s => s.from || s.to || s.date || s.departureDate);

        if (hasSegments) {
            alreadyHasSegments++;
            // Still need to migrate old segment format { date } → { departureDate }
            const needsFieldRename = b.segments.some(s => s.date && !s.departureDate);
            if (needsFieldRename) {
                const updatedSegments = b.segments.map(s => ({
                    from: s.from || '',
                    to: s.to || '',
                    departureDate: s.departureDate || s.date || null,
                    returnDate: s.returnDate || null,
                    returnDepartureTime: s.returnDepartureTime || null,
                    tripType: s.tripType || b.tripType || 'one-way',
                    country: s.country || b.destination || null,
                }));
                if (!DRY_RUN) {
                    await bookings.updateOne({ _id: b._id }, { $set: { segments: updatedSegments } });
                }
                backfilled++;
            }
            continue;
        }

        // Build segment from legacy root fields
        const from = b.flightFrom || null;
        const to = b.flightTo || null;
        const departureDate = b.travelDate || null;
        const returnDate = b.returnDate || null;
        const tripType = b.tripType || 'one-way';
        const country = b.destination || null;

        // If we have NO flight data at all, try passenger data
        let passengerFrom = null, passengerTo = null, passengerDep = null, passengerRet = null, passengerCountry = null;
        if (!from && !to && !departureDate) {
            const pax = await passengers.findOne({ bookingId: b._id });
            if (pax) {
                passengerFrom = pax.flightFrom || null;
                passengerTo = pax.flightTo || null;
                passengerDep = pax.departureTime ? new Date(pax.departureTime) : null;
                passengerRet = pax.returnDepartureTime ? new Date(pax.returnDepartureTime) : null;
                passengerCountry = pax.country || null;
            }
        }

        const finalFrom = from || passengerFrom;
        const finalTo = to || passengerTo;
        const finalDep = departureDate || passengerDep;
        const finalRet = returnDate || passengerRet;
        const finalCountry = country || passengerCountry;

        if (!finalFrom && !finalTo && !finalDep) {
            noData++;
            continue; // Nothing to backfill — segments stays empty []
        }

        const newSegment = {
            from: finalFrom || '',
            to: finalTo || '',
            departureDate: finalDep,
            returnDate: finalRet || null,
            returnDepartureTime: null,
            tripType: tripType,
            country: finalCountry,
        };

        const updateData = { segments: [newSegment] };

        // Also sync amount → totalAmount
        if ((b.totalAmount === 0 || !b.totalAmount) && b.amount > 0) {
            updateData.totalAmount = b.amount;
            amountSynced++;
        }

        if (!DRY_RUN) {
            await bookings.updateOne({ _id: b._id }, { $set: updateData });
        }
        backfilled++;
    }

    console.log(`\n── Results ──`);
    console.log(`  Already had segments: ${alreadyHasSegments}`);
    console.log(`  Backfilled from legacy fields: ${backfilled}`);
    console.log(`  amount → totalAmount synced: ${amountSynced}`);
    console.log(`  No data to backfill (empty): ${noData}`);
    console.log(`  Total processed: ${allBookings.length}`);

    if (DRY_RUN) {
        console.log(`\n⚠️  DRY-RUN complete. Run with --apply to write changes.`);
    } else {
        console.log(`\n✅  Migration applied successfully.`);
    }

    await client.close();
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
