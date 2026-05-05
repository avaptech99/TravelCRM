/**
 * CRM Performance Patch - Payment & Contact Backfill
 * 
 * This script ensures all legacy bookings have:
 * 1. An 'outstanding' balance (Total Amount - Total Paid).
 * 2. An embedded 'contact' snapshot for sub-100ms analytics.
 */

db = db.getSiblingDB('travelCRM');

print('🚀 Starting Payment & Contact Backfill...');

let updatedBookings = 0;

db.bookings.find({}).forEach(booking => {
    // 1. Calculate Outstanding Balance
    const payments = db.payments.find({ bookingId: booking._id }).toArray();
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const amount = booking.totalAmount || booking.amount || 0;
    const outstanding = Math.max(amount - totalPaid, 0);

    // 2. Fetch Primary Contact for Embedding
    let contactSnapshot = booking.contact || { name: '', phone: '', type: '', interested: false };
    
    if (booking.primaryContactId) {
        const primaryContact = db.primarycontacts.findOne({ _id: booking.primaryContactId });
        if (primaryContact) {
            contactSnapshot = {
                name: primaryContact.contactName || '',
                phone: primaryContact.contactPhoneNo || '',
                type: primaryContact.bookingType || 'Direct (B2C)',
                interested: !!primaryContact.interested
            };
        }
    }

    // 3. Update Booking
    db.bookings.updateOne(
        { _id: booking._id },
        { 
            $set: { 
                outstanding: outstanding,
                contact: contactSnapshot
            } 
        }
    );
    
    updatedBookings++;
    if (updatedBookings % 100 === 0) {
        print('   Processed: ' + updatedBookings + ' bookings...');
    }
});

print('\n✅ BACKFILL COMPLETE:');
print('   Updated ' + updatedBookings + ' bookings with accurate outstanding balances and contact snapshots.');
