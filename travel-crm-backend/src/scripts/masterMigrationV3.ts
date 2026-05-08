import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import Notification from '../models/Notification';
import Payment from '../models/Payment';

dotenv.config();

const masterMigrationV3 = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_crm';
        console.log('🚀 Starting Master Migration V3...');
        console.log('Connecting to:', mongoURI.split('@').pop()); // Log host only for security
        
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // 1. Data Type Normalization (String -> Number/Boolean)
        console.log('\n--- 1. Normalizing Data Types ---');
        
        // Bookings: amount, totalAmount, outstanding, includesFlight
        const bookingsToFix = await Booking.find({
            $or: [
                { amount: { $type: "string" } },
                { totalAmount: { $type: "string" } },
                { outstanding: { $type: "string" } },
                { includesFlight: { $type: "string" } }
            ]
        }).lean();

        console.log(`Found ${bookingsToFix.length} bookings with incorrect types.`);
        
        for (const b of bookingsToFix) {
            const updates: any = {};
            if (typeof b.amount === 'string') updates.amount = parseFloat(b.amount) || 0;
            if (typeof b.totalAmount === 'string') updates.totalAmount = parseFloat(b.totalAmount) || 0;
            if (typeof b.outstanding === 'string') updates.outstanding = parseFloat(b.outstanding) || 0;
            if (typeof b.includesFlight === 'string') updates.includesFlight = b.includesFlight === 'true';
            
            await Booking.updateOne({ _id: b._id }, { $set: updates });
        }
        console.log('✅ Booking types normalized.');

        // Payments: amount
        const paymentsToFix = await Payment.find({ amount: { $type: "string" } }).lean();
        console.log(`Found ${paymentsToFix.length} payments with incorrect types.`);
        for (const p of paymentsToFix) {
            await Payment.updateOne({ _id: p._id }, { $set: { amount: parseFloat(p.amount as any) || 0 } });
        }
        console.log('✅ Payment types normalized.');

        // 2. Backfill Contact Snapshots for Legacy Bookings
        console.log('\n--- 2. Backfilling Contact Snapshots ---');
        const legacyBookings = await Booking.find({ contact: { $exists: false } }).lean();
        console.log(`Found ${legacyBookings.length} legacy bookings missing contact snapshots.`);

        let backfillCount = 0;
        for (const b of legacyBookings) {
            // Check both current field (primaryContactId) and legacy field (contactId)
            const pcId = b.primaryContactId || (b as any).contactId;
            
            if (pcId) {
                const pc = await PrimaryContact.findById(pcId).lean();
                if (pc) {
                    await Booking.updateOne({ _id: b._id }, {
                        $set: {
                            contact: {
                                name: pc.contactName,
                                phone: pc.contactPhoneNo,
                                email: pc.contactEmail || null,
                                type: pc.bookingType === 'Agent (B2B)' ? 'B2B' : 'B2C',
                                requirements: pc.requirements || null,
                                interested: (pc.interested as any) === 'Yes' || (pc.interested as any) === true
                            },
                            primaryContactId: pcId // Ensure the new field is also populated
                        }
                    });
                    backfillCount++;
                }
            }
        }
        console.log(`✅ Backfilled ${backfillCount} contact snapshots.`);

        // 3. Backfill participantIds
        console.log('\n--- 3. Backfilling Participant IDs ---');
        const participantsToFix = await Booking.find({ participantIds: { $size: 0 } }).lean();
        console.log(`Found ${participantsToFix.length} bookings missing participants.`);
        
        for (const b of participantsToFix) {
            const ids = [b.createdByUserId, b.assignedToUserId].filter(id => id != null);
            await Booking.updateOne({ _id: b._id }, { $set: { participantIds: ids } });
        }
        console.log('✅ Participant IDs backfilled.');

        // 4. TTL Index Cleanup (Notifications)
        console.log('\n--- 4. Cleaning Up Old Notifications ---');
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const delNotif = await Notification.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
        console.log(`✅ Removed ${delNotif.deletedCount} expired notifications.`);

        console.log('\n🚀 Master Migration V3 Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Migration Failed:', err);
        process.exit(1);
    }
};

masterMigrationV3();
