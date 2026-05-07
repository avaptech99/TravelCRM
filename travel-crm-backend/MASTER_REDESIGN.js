const mongoose = require('mongoose');

async function runRedesign() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CRM3';
    console.log(`🚀 Starting Master Redesign on ${uri}...`);

    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        // 1. REPAIR DATA - Backfill Contact Snapshot
        console.log('\n[1/3] Repairing Contact Snapshots...');
        const bookings = await db.collection('bookings').find({}).toArray();
        let repairCount = 0;
        for (const booking of bookings) {
            const primaryContact = await db.collection('primarycontacts').findOne({ _id: booking.primaryContactId });
            
            if (primaryContact) {
                // Determine boolean interested
                let isInterested = false;
                if (booking.contact && typeof booking.contact.interested === 'boolean') {
                    isInterested = booking.contact.interested;
                } else if (primaryContact.interested === 'Yes' || primaryContact.interested === true) {
                    isInterested = true;
                }

                await db.collection('bookings').updateOne(
                    { _id: booking._id },
                    {
                        $set: {
                            contact: {
                                name: primaryContact.contactName || 'Unknown',
                                phone: primaryContact.contactPhoneNo || 'Unknown',
                                type: primaryContact.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                                interested: isInterested
                            }
                        },
                        $unset: {
                            contactPerson: "",
                            contactNumber: "",
                            contactName: "", // Just in case legacy fields exist
                            contactPhone: ""
                        }
                    }
                );
                repairCount++;
            }
        }
        console.log(`✅ Repaired ${repairCount} contact snapshots.`);

        // 2. CLEAN INDEXES - Drop and Recreate
        console.log('\n[2/3] Optimizing Indexes (Redesign Plan)...');
        
        // Drop all except _id
        try {
            await db.collection('bookings').dropIndexes();
            console.log('Dropped old indexes.');
        } catch (e) {
            console.log('No indexes to drop (or only _id remains).');
        }

        // Recreate Optimized Indexes
        const newIndexes = [
            { key: { uniqueCode: 1 }, options: { unique: true, sparse: true } },
            { key: { assignedToUserId: 1, status: 1, lastInteractionAt: -1 }, options: { background: true } },
            { key: { assignedToUserId: 1, lastInteractionAt: -1 }, options: { background: true } },
            { key: { status: 1, lastInteractionAt: -1 }, options: { background: true } },
            { key: { createdByUserId: 1, lastInteractionAt: -1 }, options: { background: true } },
            { key: { company: 1 }, options: { background: true } },
            { key: { createdAt: -1 }, options: { background: true } },
            { key: { 'contact.name': 1 }, options: { background: true } },
            { key: { 'contact.phone': 1 }, options: { background: true } }
        ];

        for (const idx of newIndexes) {
            await db.collection('bookings').createIndex(idx.key, idx.options);
            console.log(`Created index: ${JSON.stringify(idx.key)}`);
        }
        console.log('✅ Index redesign complete.');

        // 3. FIX BOOLEANS & NUMBERS (Second pass to be safe)
        console.log('\n[3/3] Final Type Hardening...');
        await db.collection('bookings').updateMany({ includesFlight: "True" }, { $set: { includesFlight: true } });
        await db.collection('bookings').updateMany({ includesFlight: "False" }, { $set: { includesFlight: false } });
        await db.collection('bookings').updateMany({ isVerified: "True" }, { $set: { isVerified: true } });
        await db.collection('bookings').updateMany({ isVerified: "False" }, { $set: { isVerified: false } });

        console.log('\n✨ REDESIGN APPLIED SUCCESSFULLY.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Redesign failed:', err);
        process.exit(1);
    }
}

runRedesign();
