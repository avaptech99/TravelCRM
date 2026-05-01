const { MongoClient } = require('mongodb');

async function verify() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('travel_crm');

    console.log('=== PHASE 3: VERIFICATION QUERIES ===\n');

    // Query 1
    console.log('1. db.contacts.countDocuments()');
    const c1 = await db.collection('contacts').countDocuments();
    console.log('   Result:', c1, '(expected ~498)\n');

    // Query 2
    console.log('2. db.bookings.findOne() — check NO flightFrom, NO status, NO estimatedCosts');
    const b = await db.collection('bookings').findOne();
    if (b) {
        console.log('   Fields present:', Object.keys(b).join(', '));
        const bad = ['flightFrom', 'status', 'estimatedCosts', 'primaryContactId'].filter(f => f in b);
        console.log('   OLD fields found:', bad.length === 0 ? 'NONE ✅' : bad.join(', ') + ' ❌');
    } else {
        console.log('   No bookings found');
    }
    console.log();

    // Query 3
    console.log('3. db.segments.countDocuments()');
    const c3 = await db.collection('segments').countDocuments();
    console.log('   Result:', c3, '(expected > 0)\n');

    // Query 4
    console.log('4. db.costs.countDocuments()');
    const c4 = await db.collection('costs').countDocuments();
    console.log('   Result:', c4, '(expected >= 0)\n');

    // Query 5
    console.log('5. db.passengers.findOne() — check NO flightFrom');
    const p = await db.collection('passengers').findOne();
    if (p) {
        console.log('   Fields present:', Object.keys(p).join(', '));
        const pBad = ['flightFrom', 'flightTo', 'tripType', 'departureTime'].filter(f => f in p);
        console.log('   OLD fields found:', pBad.length === 0 ? 'NONE ✅' : pBad.join(', ') + ' ❌');
    } else {
        console.log('   No passengers found');
    }
    console.log();

    // Query 6
    console.log('6. db.comments.findOne({ bookingId: { $exists: true } }) — should have contactId');
    const cm = await db.collection('comments').findOne({
        bookingId: { $exists: true, $ne: null },
    });
    if (cm) {
        console.log('   Has bookingId:', !!cm.bookingId, '| Has contactId:', !!cm.contactId);
        console.log('   Result:', (cm.bookingId && cm.contactId) ? 'PASS ✅' : 'FAIL ❌');
    } else {
        console.log('   No comments with bookingId found');
    }
    console.log();

    // Query 7
    console.log('7. db.bookings.findOne({ flightFrom: { $exists: true } }) — should be NULL');
    const stale = await db.collection('bookings').findOne({ flightFrom: { $exists: true } });
    console.log('   Result:', stale === null ? 'NULL ✅ (no old fields remaining)' : 'FOUND ❌ — old fields still exist');

    console.log('\n=== VERIFICATION COMPLETE ===');
    await client.close();
}

verify();
