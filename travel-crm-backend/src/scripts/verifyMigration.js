/**
 * CRM 3.0 Database Health & Verification Script (Mongosh Compatible)
 */

const dbName = db.getName();
print("\n--- 🏁 CRM 3.0 Post-Migration Health Audit: " + dbName + " ---");

// 1. Audit Contact Snapshots
const totalBookings = db.bookings.countDocuments({});
const migratedBookings = db.bookings.countDocuments({ contact: { $exists: true } });
const legacyRemaining = totalBookings - migratedBookings;

print("\n[1/4] Snapshot Visibility:");
print("   - Total Bookings: " + totalBookings);
print("   - Migrated (With Snapshot): " + migratedBookings);
if (legacyRemaining > 0) {
    print("   - ⚠️ WARNING: " + legacyRemaining + " leads are still missing snapshots.");
} else {
    print("   - ✅ SUCCESS: 100% Lead Visibility achieved.");
}

// 2. Audit Data Types
print("\n[2/4] Schema Type Audit (Native BSON):");
const stringAmounts = db.bookings.countDocuments({ amount: { $type: "string" } });
const stringIncludesFlight = db.bookings.countDocuments({ includesFlight: { $type: "string" } });

if (stringAmounts === 0 && stringIncludesFlight === 0) {
    print("   - ✅ SUCCESS: All fields are using native Number/Boolean types.");
} else {
    print("   - ⚠️ WARNING: Found " + stringAmounts + " records with String-based amounts. Indexes will be slow.");
}

// 3. Audit participantIds
print("\n[3/4] Access Control Audit:");
const missingParticipants = db.bookings.countDocuments({ 
    $or: [
        { participantIds: { $exists: false } },
        { participantIds: { $size: 0 } }
    ]
});

if (missingParticipants === 0) {
    print("   - ✅ SUCCESS: All leads have participantIds for secure visibility.");
} else {
    print("   - ⚠️ WARNING: " + missingParticipants + " leads are missing participant access lists.");
}

// 4. Index Verification
print("\n[4/4] Performance Index Check:");
const indexes = db.bookings.getIndexes();
const indexNames = indexes.map(idx => idx.name);

// Check for the names returned by your manual creation
const criticalNames = ["updatedAt_-1", "outstanding_1_status_1", "participantIds_1_status_1_createdAt_-1"];

criticalNames.forEach(name => {
    if (indexNames.includes(name)) {
        print("   - ✅ ACTIVE: " + name);
    } else {
        print("   - ❌ MISSING: " + name);
    }
});

print("\n--- Audit Complete ---\n");
