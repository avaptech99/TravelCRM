/**
 * TRAVEL CRM - MASTER REDESIGN SCRIPT (V8.2)
 * ANALYTICS OPTIMIZATION - Resolves 20s dashboard delays
 */

const d = db.getSiblingDB('TravelCRM');
print('🚀 Running Master Redesign (V8.2) - Analytics Speed Boost');

const existingColls = d.getCollectionNames();

// 1. BULK MIGRATION: Comments & Activities -> Timeline
print('\n[1] Migrating legacy logs (Bulk Mode)...');
const timelineOps = [];

// Comments
if (existingColls.includes('comments')) {
    d.comments.find().forEach(c => {
        timelineOps.push({
            updateOne: {
                filter: { _id: c._id },
                update: {
                    $setOnInsert: {
                        bookingId: c.bookingId,
                        userId: c.userId,
                        type: 'comment',
                        text: c.text,
                        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                        createdAt: c.createdAt || new Date()
                    }
                },
                upsert: true
            }
        });
    });
}

// Activities
if (existingColls.includes('activities')) {
    d.activities.find().forEach(a => {
        timelineOps.push({
            updateOne: {
                filter: { _id: a._id },
                update: {
                    $setOnInsert: {
                        bookingId: a.bookingId,
                        userId: a.userId,
                        type: 'activity',
                        action: a.action,
                        details: a.details,
                        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                        createdAt: a.createdAt || new Date()
                    }
                },
                upsert: true
            }
        });
    });
}

if (timelineOps.length > 0) {
    const res = d.timelines.bulkWrite(timelineOps, { ordered: false });
    print('✅ Migrated/Verified ' + (res.upsertedCount + res.matchedCount) + ' timeline entries.');
} else {
    print('ℹ️ No logs found to migrate.');
}

// 2. INDEXING (CRITICAL SPEED BOOSTS)
print('\n[2] Optimizing Analytics & Core Indexes...');
try {
    // Analytics Speed Boosts
    d.bookings.createIndex({ outstanding: 1 });
    d.bookings.createIndex({ travelDate: 1, status: 1 });
    d.bookings.createIndex({ createdAt: -1 });
    d.bookings.createIndex({ status: 1, lastInteractionAt: -1 });
    d.users.createIndex({ role: 1 });
    
    // Core Logic Indexes
    d.timelines.createIndex({ bookingId: 1, createdAt: -1 });
    d.timelines.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }); 
    d.payments.createIndex({ bookingId: 1 });
    d.bookings.createIndex({ uniqueCode: 1 }, { unique: true, sparse: true });
    
    print('✅ All indexes optimized (including Analytics Boosts).');
} catch (e) {
    print('ℹ️ Some indexes already exist or skipped.');
}

// 3. BULK DATA REPAIRS & SNAPSHOTS
print('\n[3] Running Bulk Repairs & Snapshots...');
const bookingOps = [];

// Repair segments string
d.bookings.find({ segments: "[]" }).forEach(b => {
    bookingOps.push({
        updateOne: {
            filter: { _id: b._id },
            update: { $set: { segments: [] } }
        }
    });
});

// Backfill snapshots from primarycontacts
d.bookings.find().forEach(booking => {
    const needsRepair = !booking.contact || !booking.contact.email || !booking.contact.name;
    if (needsRepair) {
        const pc = d.primarycontacts.findOne({ _id: booking.primaryContactId });
        if (pc) {
            bookingOps.push({
                updateOne: {
                    filter: { _id: booking._id },
                    update: {
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
                }
            });
        }
    }
});

if (bookingOps.length > 0) {
    const res = d.bookings.bulkWrite(bookingOps, { ordered: false });
    print('✅ Repaired ' + res.modifiedCount + ' booking records.');
} else {
    print('✅ All bookings are already healthy.');
}

print('\n✨ REDESIGN V8.2 COMPLETE.');
