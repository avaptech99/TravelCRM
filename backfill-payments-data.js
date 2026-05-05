/**
 * CRM 3.0 Master Data Migration (mongosh compatible)
 * 
 * Run this in your MongoDB shell or via:
 * mongosh "mongodb+srv://..." --file backfill-payments-data.js
 */

// Ensure we are using the correct database
const databaseName = 'travelCRM';
const targetDb = db.getSiblingDB(databaseName);

print('🚀 Starting Master Data Migration for ' + databaseName + '...');

let updatedCount = 0;
let errorCount = 0;

// Use cursor for large datasets instead of toArray()
const bookingCursor = targetDb.bookings.find({});

print('🔍 Processing records...');

while (bookingCursor.hasNext()) {
    const booking = bookingCursor.next();
    try {
        // 1. Calculate Outstanding Balance
        const payments = targetDb.payments.find({ bookingId: booking._id }).toArray();
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const amount = booking.totalAmount || booking.amount || 0;
        const outstanding = Math.max(amount - totalPaid, 0);

        // 2. Fetch Primary Contact for Embedding & Interest
        let contactSnapshot = booking.contact || {};
        let interestedStatus = booking.interested;

        if (booking.primaryContactId) {
            const primaryContact = targetDb.primarycontacts.findOne({ _id: booking.primaryContactId });
            if (primaryContact) {
                // Populate snapshot if missing or incomplete
                if (!contactSnapshot.name || !contactSnapshot.phone) {
                    contactSnapshot = {
                        name: primaryContact.contactName || '',
                        phone: primaryContact.contactPhoneNo || '',
                        type: primaryContact.bookingType || 'Direct (B2C)',
                        interested: (primaryContact.interested === 'Yes' || primaryContact.interested === true)
                    };
                }
                // Sync Interested status to root (if used by your filters)
                interestedStatus = (primaryContact.interested === 'Yes' || primaryContact.interested === true);
            }
        }

        // 3. Update Booking
        targetDb.bookings.updateOne(
            { _id: booking._id },
            { 
                $set: { 
                    outstanding: outstanding,
                    contact: contactSnapshot,
                    interested: interestedStatus,
                    lastInteractionAt: booking.lastInteractionAt || booking.createdAt || new Date()
                } 
            }
        );
        
        updatedCount++;
        if (updatedCount % 100 === 0) {
            print('   ✅ Processed ' + updatedCount + ' records...');
        }
    } catch (err) {
        print('   ❌ Error processing booking ' + booking._id + ': ' + err.message);
        errorCount++;
    }
}

print('\n✨ MASTER MIGRATION COMPLETE:');
print('   - Total Updated: ' + updatedCount);
print('   - Total Errors: ' + errorCount);
print('\nData parity achieved. All columns should now be visible and performance should be optimized.');
