/**
 * CRM 3.0 Master Migration V4 - Final Cleanup & Optimization
 * 
 * Instructions:
 * 1. Open mongosh (locally or via Atlas).
 * 2. Connect to your database.
 * 3. Copy and paste this script or run: load("masterMigrationV4.js")
 */

const dbName = db.getName();
print("\n🔥 Starting Final Cleanup Migration V4 on: " + dbName);

// 1. Drop Legacy Collections (Unified into 'comments' and 'passengers')
print("\n--- 1. Dropping Obsolete Collections ---");

const collectionsToDrop = [
    'timelines',      // Unified into comments
    'activities',     // Unified into comments
    'crmsettings',    // Obsolete
    'travellers',     // Unified into passengers
    'activities_backup' // Old backup
];

collectionsToDrop.forEach(col => {
    // Note: in mongosh, db.collection.exists() is not a function, 
    // we use getCollectionNames().includes(col) or just call drop() (it's safe if it doesn't exist)
    if (db.getCollectionNames().includes(col)) {
        db.getCollection(col).drop();
        print("✅ Dropped collection: " + col);
    } else {
        print("ℹ️  Collection already gone: " + col);
    }
});

// 2. Final Index Optimization for Bookings (Atlas M0 Optimized)
print("\n--- 2. Optimizing Indexes ---");

print("   - Creating high-performance covering indexes...");
db.bookings.createIndex({ participantIds: 1, status: 1, createdAt: -1 }, { background: true });
db.bookings.createIndex({ outstanding: 1, status: 1 }, { background: true });
db.bookings.createIndex({ assignedGroup: 1, status: 1 }, { background: true });
db.bookings.createIndex({ createdAt: -1 }, { background: true });

print("✅ Index optimization complete.");

// 3. Comments Schema Final Polish
print("\n--- 3. Final Polish for Comments ---");
// Ensure all legacy entries are synced before dropping (Double check)
db.comments.updateMany(
  { userId: { $exists: false }, createdById: { $exists: true } },
  [{ $set: { userId: "$createdById" } }]
);
db.comments.updateMany({}, { $unset: { createdById: "", type: "", __v: "" } });
print("✅ Comments collection polished.");

print("\n🎉 Master Migration V4 Completed! Your database is now clean and optimized.");
print("You can now safely delete old migration scripts from the /scripts directory.\n");
