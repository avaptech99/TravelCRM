/**
 * CRM 3.0 Master Migration V4 - High Performance Bulk Edition
 * 
 * Performance: Uses bulkWrite() to minimize network round-trips.
 * Ideal for large datasets on Atlas M0.
 */

const dbName = db.getName();
print("\n🚀 Starting High-Performance Bulk Migration V4 on: " + dbName);

const BATCH_SIZE = 500;
let bulkOps = [];
let totalProcessed = 0;

// 1. Unified Booking Migration (Types + Snapshots + Participants)
print("\n[1/2] Processing Bookings (Bulk Mode)...");

const bookingCursor = db.bookings.find({
    $or: [
        { contact: { $exists: false } },
        { amount: { $type: "string" } },
        { totalAmount: { $type: "string" } },
        { participantIds: { $exists: false } }
    ]
});

bookingCursor.forEach(doc => {
    let updateFields = {};
    
    // Type Normalization
    if (typeof doc.amount === 'string') updateFields.amount = parseFloat(doc.amount) || 0;
    if (typeof doc.totalAmount === 'string') updateFields.totalAmount = parseFloat(doc.totalAmount) || 0;
    if (typeof doc.outstanding === 'string') updateFields.outstanding = parseFloat(doc.outstanding) || 0;
    if (typeof doc.includesFlight === 'string') updateFields.includesFlight = (doc.includesFlight === 'true');

    // Contact Snapshot
    const pcId = doc.primaryContactId || doc.contactId;
    if (pcId && !doc.contact) {
        const objId = (typeof pcId === 'string') ? ObjectId(pcId) : pcId;
        const pc = db.primarycontacts.findOne({ _id: objId });
        if (pc) {
            updateFields.contact = {
                name: pc.contactName,
                phone: pc.contactPhoneNo,
                email: pc.contactEmail || null,
                type: pc.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                requirements: pc.requirements || null,
                interested: (pc.interested === 'Yes' || pc.interested === true)
            };
            updateFields.primaryContactId = objId;
        }
    }

    // Participants
    if (!doc.participantIds || doc.participantIds.length === 0) {
        let ids = [];
        if (doc.createdByUserId) ids.push(doc.createdByUserId);
        if (doc.assignedToUserId) ids.push(doc.assignedToUserId);
        updateFields.participantIds = [...new Set(ids.filter(id => id != null))];
    }

    if (Object.keys(updateFields).length > 0) {
        bulkOps.push({
            updateOne: {
                filter: { _id: doc._id },
                update: { $set: updateFields }
            }
        });
    }

    // Execute Batch
    if (bulkOps.length >= BATCH_SIZE) {
        db.bookings.bulkWrite(bulkOps);
        totalProcessed += bulkOps.length;
        print("   - Processed " + totalProcessed + " bookings...");
        bulkOps = [];
    }
});

// Final Flush
if (bulkOps.length > 0) {
    db.bookings.bulkWrite(bulkOps);
    totalProcessed += bulkOps.length;
    bulkOps = [];
}
print("✅ Booking bulk migration complete (" + totalProcessed + " updated).");

// 2. Unified Payment Migration
print("\n[2/2] Processing Payments (Bulk Mode)...");
let paymentCount = 0;
db.payments.find({ amount: { $type: "string" } }).forEach(doc => {
    bulkOps.push({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: { amount: parseFloat(doc.amount) || 0 } }
        }
    });

    if (bulkOps.length >= BATCH_SIZE) {
        db.payments.bulkWrite(bulkOps);
        paymentCount += bulkOps.length;
        bulkOps = [];
    }
});

if (bulkOps.length > 0) {
    db.payments.bulkWrite(bulkOps);
    paymentCount += bulkOps.length;
    bulkOps = [];
}
print("✅ Payment bulk migration complete (" + paymentCount + " updated).");

print("\n🚀 Bulk Migration V4 Completed Successfully!\n");
