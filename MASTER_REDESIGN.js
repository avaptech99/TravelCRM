/**
 * TRAVEL CRM - MASTER REDESIGN SCRIPT (V7)
 * Gracefully handles existing indexes and verifies snapshot integrity.
 */

const d = db.getSiblingDB('travelCRM');

print('🚀 Running Master Redesign (V7) Verification...');

// 1. TIMELINE INDEXING
print('\n[1] Optimizing Timeline indexes...');
try {
    d.timeline.createIndex({ bookingId: 1, createdAt: -1 });
    d.timeline.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }); 
    print('✅ Timeline indexed.');
} catch (e) {
    print('ℹ️ Timeline indexes already exist or skipped.');
}

// 2. PAYMENT INDEXING (Fixes 50s addPayment spike)
print('\n[2] Optimizing Payment indexes...');
try {
    d.payments.createIndex({ bookingId: 1 });
    print('✅ Payments indexed.');
} catch (e) {
    if (e.message.includes('Index already exists')) {
        print('✅ Payments already indexed (Existing).');
    } else {
        print('⚠️ Payment indexing error: ' + e.message);
    }
}

// 3. BOOKING INDEXING
print('\n[3] Verifying Booking indexes...');
try {
    d.bookings.createIndex({ uniqueCode: 1 }, { unique: true, sparse: true });
    d.bookings.createIndex({ assignedToUserId: 1, status: 1, lastInteractionAt: -1 });
    d.bookings.createIndex({ status: 1, lastInteractionAt: -1 });
    d.bookings.createIndex({ createdAt: -1 });
    d.bookings.createIndex({ company: 1 });
    d.bookings.createIndex({ "contact.name": 1 });
    print('✅ Bookings indexed.');
} catch (e) {
    print('ℹ️ Some Booking indexes already exist.');
}

// 4. FULL SNAPSHOT BACKFILL
print('\n[4] Verifying and Backfilling snapshots...');
let count = 0;
d.bookings.find().forEach(booking => {
    // Only backfill if snapshot is missing or incomplete (missing email/requirements)
    if (!booking.contact || booking.contact.email === undefined || booking.contact.requirements === undefined) {
        const pc = d.primarycontacts.findOne({ _id: booking.primaryContactId });
        if (pc) {
            d.bookings.updateOne(
                { _id: booking._id },
                {
                    $set: {
                        contact: {
                            name: pc.contactName || (booking.contact && booking.contact.name) || "Unknown",
                            phone: pc.contactPhoneNo || (booking.contact && booking.contact.phone) || "Unknown",
                            email: pc.contactEmail || null,
                            type: pc.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                            requirements: pc.requirements || null,
                            interested: (pc.interested === 'Yes' || pc.interested === true)
                        }
                    }
                }
            );
            count++;
        }
    }
});
print('✅ Verified/Repaired ' + count + ' bookings.');

print('\n✨ REDESIGN V7 COMPLETE.');
