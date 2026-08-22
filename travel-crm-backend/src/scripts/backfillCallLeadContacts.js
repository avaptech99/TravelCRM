/**
 * Backfill script: fills in contact.name/contact.phone/contact.type on Booking
 * documents created by the phone webhook before it started saving that block
 * (bookings whose Contact Person / Contact Number columns show "-" in the UI).
 *
 * Run with: mongosh "<MONGODB_URI>" src/scripts/backfillCallLeadContacts.js
 */

const dbName = db.getName();
print("\n--- Backfilling call-lead contact info: " + dbName + " ---");

const missing = db.bookings.find({
    primaryContactId: { $exists: true, $ne: null },
    $or: [
        { "contact.phone": { $in: [null, ""] } },
        { contact: { $exists: false } },
    ],
});

let updated = 0;
let skipped = 0;

missing.forEach((booking) => {
    const contact = db.primarycontacts.findOne({ _id: booking.primaryContactId });
    if (!contact || !contact.contactPhoneNo) {
        skipped++;
        return;
    }

    db.bookings.updateOne(
        { _id: booking._id },
        {
            $set: {
                contact: {
                    name: contact.contactName || "Unknown",
                    phone: contact.contactPhoneNo,
                    type: contact.bookingType || "Direct (B2C)",
                    requirements: contact.requirements || null,
                    interested: (booking.contact && booking.contact.interested === true) || false,
                },
            },
        }
    );
    updated++;
});

print("\n   - Updated: " + updated);
print("   - Skipped (no linked contact/phone): " + skipped);
print("\n--- Done ---\n");
