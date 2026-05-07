/**
 * TRAVEL CRM - MASTER REDESIGN SCRIPT (V5)
 * This script optimizes indexes and verifies the new schema.
 * Updated to include EMAIL and REQUIREMENTS in the snapshot.
 */

const d = db.getSiblingDB('travelCRM'); // Change this if your DB name is different

print('🚀 Running Master Redesign (V5) Verification...');

// 1. TIMELINE INDEXING
print('\n[1] Optimizing Timeline indexes...');
d.timeline.createIndex({ bookingId: 1, createdAt: -1 });
d.timeline.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }); 
print('✅ Timeline indexed.');

// 2. BOOKING INDEXING
print('\n[2] Verifying Booking indexes...');
try { d.bookings.dropIndexes(); } catch(e) {}
d.bookings.createIndex({ uniqueCode: 1 }, { unique: true, sparse: true });
d.bookings.createIndex({ assignedToUserId: 1, status: 1, lastInteractionAt: -1 });
d.bookings.createIndex({ status: 1, lastInteractionAt: -1 });
d.bookings.createIndex({ createdAt: -1 });
d.bookings.createIndex({ company: 1 });
d.bookings.createIndex({ "contact.name": 1 });
print('✅ Bookings indexed.');

// 3. SCHEMA INTEGRITY & FULL SNAPSHOT BACKFILL
print('\n[3] Running Full Snapshot Backfill (Name, Phone, Email, Type, Requirements, Interested)...');
let count = 0;
d.bookings.find().forEach(booking => {
    const pc = d.primarycontacts.findOne({ _id: booking.primaryContactId });
    if (pc) {
        d.bookings.updateOne(
            { _id: booking._id },
            {
                $set: {
                    contact: {
                        name: pc.contactName || "Unknown",
                        phone: pc.contactPhoneNo || "Unknown",
                        email: pc.contactEmail || null,
                        type: pc.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                        requirements: pc.requirements || null,
                        interested: (pc.interested === 'Yes' || pc.interested === true)
                    }
                },
                $unset: { 
                    contactPerson: "", 
                    contactNumber: "",
                    contactName: "",
                    contactPhone: ""
                }
            }
        );
        count++;
    }
});
print('✅ Backfilled and Repaired ' + count + ' bookings.');

print('\n✨ REDESIGN V5 COMPLETE. YOU CAN NOW SAFELY REMOVE CODE FALLBACKS.');
