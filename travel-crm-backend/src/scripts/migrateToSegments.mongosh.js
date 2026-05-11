/**
 * CRM 3.0 — Mongosh Migration Script: Backfill segments[] from legacy flat fields
 * 
 * Instructions:
 * 1. Open mongosh: mongosh "mongodb://127.0.0.1:27017/travel_crm"
 * 2. Run the script: load("C:\\CRM AFTER ALL FIX BUT NO RESULT\\CRM 3.0\\travel-crm-backend\\src\\scripts\\migrateToSegments.mongosh.js")
 * 
 * To APPLY changes:
 * var APPLY_CHANGES = true;
 * load("C:\\CRM AFTER ALL FIX BUT NO RESULT\\CRM 3.0\\travel-crm-backend\\src\\scripts\\migrateToSegments.mongosh.js")
 */

// --- CONFIGURATION ---
var DRY_RUN = (typeof APPLY_CHANGES === 'undefined') || (APPLY_CHANGES !== true);

print("\n=== CRM 3.0 Segments Migration (Mongosh) ===");
print("Mode: " + (DRY_RUN ? "🔍 DRY-RUN (no writes)" : "🔥 APPLY (writing changes)"));
print("Database: " + db.getName() + "\n");

var bookingsCollection = db.getCollection('bookings');
var passengersCollection = db.getCollection('passengers');

var allBookings = bookingsCollection.find({}).toArray();
print("Total bookings: " + allBookings.length);

var backfilled = 0;
var amountSynced = 0;
var alreadyHasSegments = 0;
var noData = 0;

allBookings.forEach(function(b) {
    var hasSegments = b.segments && b.segments.length > 0 && b.segments.some(function(s) {
        return s.from || s.to || s.date || s.departureDate;
    });

    if (hasSegments) {
        alreadyHasSegments++;
        
        // Still need to migrate old segment format { date } → { departureDate }
        var needsFieldRename = b.segments.some(function(s) { return s.date && !s.departureDate; });
        if (needsFieldRename) {
            var updatedSegments = b.segments.map(function(s) {
                return {
                    from: s.from || '',
                    to: s.to || '',
                    departureDate: s.departureDate || s.date || null,
                    returnDate: s.returnDate || null,
                    returnDepartureTime: s.returnDepartureTime || null,
                    tripType: s.tripType || b.tripType || 'one-way',
                    country: s.country || b.destination || null,
                };
            });
            
            if (!DRY_RUN) {
                bookingsCollection.updateOne({ _id: b._id }, { $set: { segments: updatedSegments } });
            }
            backfilled++;
        }
        return;
    }

    // Build segment from legacy root fields
    var from = b.flightFrom || null;
    var to = b.flightTo || null;
    var departureDate = b.travelDate || null;
    var returnDate = b.returnDate || null;
    var tripType = b.tripType || 'one-way';
    var country = b.destination || null;

    // If we have NO flight data at all, try passenger data
    var passengerFrom = null, passengerTo = null, passengerDep = null, passengerRet = null, passengerCountry = null;
    if (!from && !to && !departureDate) {
        var pax = passengersCollection.findOne({ bookingId: b._id });
        if (pax) {
            passengerFrom = pax.flightFrom || null;
            passengerTo = pax.flightTo || null;
            passengerDep = pax.departureTime ? new Date(pax.departureTime) : null;
            passengerRet = pax.returnDepartureTime ? new Date(pax.returnDepartureTime) : null;
            passengerCountry = pax.country || null;
        }
    }

    var finalFrom = from || passengerFrom;
    var finalTo = to || passengerTo;
    var finalDep = departureDate || passengerDep;
    var finalRet = returnDate || passengerRet;
    var finalCountry = country || passengerCountry;

    if (!finalFrom && !finalTo && !finalDep) {
        noData++;
        return; // Nothing to backfill — segments stays empty []
    }

    var newSegment = {
        from: finalFrom || '',
        to: finalTo || '',
        departureDate: finalDep,
        returnDate: finalRet || null,
        returnDepartureTime: null,
        tripType: tripType,
        country: finalCountry,
    };

    var updateData = { segments: [newSegment] };

    // Also sync amount → totalAmount
    if ((b.totalAmount === 0 || !b.totalAmount) && b.amount > 0) {
        updateData.totalAmount = b.amount;
        amountSynced++;
    }

    if (!DRY_RUN) {
        bookingsCollection.updateOne({ _id: b._id }, { $set: updateData });
    }
    backfilled++;
});

print("\n── Results ──");
print("  Already had segments: " + alreadyHasSegments);
print("  Backfilled from legacy fields: " + backfilled);
print("  amount → totalAmount synced: " + amountSynced);
print("  No data to backfill (empty): " + noData);
print("  Total processed: " + allBookings.length);

if (DRY_RUN) {
    print("\n⚠️  DRY-RUN complete. To apply changes, run:");
    print("var APPLY_CHANGES = true;");
    print('load("' + "C:\\\\CRM AFTER ALL FIX BUT NO RESULT\\\\CRM 3.0\\\\travel-crm-backend\\\\src\\\\scripts\\\\migrateToSegments.mongosh.js" + '")');
} else {
    print("\n✅  Migration applied successfully.");
}
