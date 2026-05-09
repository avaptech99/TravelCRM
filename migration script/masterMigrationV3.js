/**
 * CRM 3.0 Master Migration V3 - Mongosh Compatible
 * 
 * Instructions:
 * 1. Open mongosh (locally or via Atlas).
 * 2. Connect to your database.
 * 3. Copy and paste this script or run: load("masterMigrationV3.js")
 */

const dbName = db.getName();
print("🚀 Starting Master Migration V3 on database: " + dbName);

// 1. Data Type Normalization
print("\n--- 1. Normalizing Data Types ---");

// Bookings
db.bookings.find({
    $or: [
        { amount: { $type: "string" } },
        { totalAmount: { $type: "string" } },
        { outstanding: { $type: "string" } },
        { includesFlight: { $type: "string" } }
    ]
}).forEach(doc => {
    let updates = {};
    if (typeof doc.amount === 'string') updates.amount = parseFloat(doc.amount) || 0;
    if (typeof doc.totalAmount === 'string') updates.totalAmount = parseFloat(doc.totalAmount) || 0;
    if (typeof doc.outstanding === 'string') updates.outstanding = parseFloat(doc.outstanding) || 0;
    if (typeof doc.includesFlight === 'string') updates.includesFlight = (doc.includesFlight === 'true');
    
    db.bookings.updateOne({ _id: doc._id }, { $set: updates });
});
print("✅ Booking types normalized.");

// Payments
db.payments.find({ amount: { $type: "string" } }).forEach(doc => {
    db.payments.updateOne({ _id: doc._id }, { $set: { amount: parseFloat(doc.amount) || 0 } });
});
print("✅ Payment types normalized.");

// 2. Backfill Contact Snapshots & primaryContactId
print("\n--- 2. Backfilling Contact Snapshots ---");

let backfillCount = 0;
db.bookings.find({ contact: { $exists: false } }).forEach(doc => {
    const pcId = doc.primaryContactId || doc.contactId;
    
    if (pcId) {
        // Convert to ObjectId if it's a string
        const objId = (typeof pcId === 'string') ? ObjectId(pcId) : pcId;
        const pc = db.primarycontacts.findOne({ _id: objId });
        
        if (pc) {
            db.bookings.updateOne({ _id: doc._id }, {
                $set: {
                    contact: {
                        name: pc.contactName,
                        phone: pc.contactPhoneNo,
                        email: pc.contactEmail || null,
                        type: pc.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                        requirements: pc.requirements || null,
                        interested: (pc.interested === 'Yes' || pc.interested === true)
                    },
                    primaryContactId: objId
                }
            });
            backfillCount++;
        }
    }
});
print("✅ Backfilled " + backfillCount + " contact snapshots.");

// 3. Backfill participantIds
print("\n--- 3. Backfilling Participant IDs ---");

db.bookings.find({ $or: [{ participantIds: { $exists: false } }, { participantIds: { $size: 0 } }] }).forEach(doc => {
    let ids = [];
    if (doc.createdByUserId) ids.push(doc.createdByUserId);
    if (doc.assignedToUserId) ids.push(doc.assignedToUserId);
    
    // De-duplicate and filter nulls
    const uniqueIds = [...new Set(ids.filter(id => id != null))];
    db.bookings.updateOne({ _id: doc._id }, { $set: { participantIds: uniqueIds } });
});
print("✅ Participant IDs backfilled.");

// 4. Notification Cleanup
print("\n--- 4. Cleaning Up Old Notifications ---");
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
const res = db.notifications.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
print("✅ Removed " + res.deletedCount + " expired notifications.");

print("\n🚀 Master Migration V3 Completed Successfully!");
