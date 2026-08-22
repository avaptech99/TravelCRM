import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Booking from '../src/models/Booking';
import PrimaryContact from '../src/models/PrimaryContact';

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected.');

        // Find bookings with missing contact.name (or where contact is totally missing/empty)
        const bookingsToUpdate = await Booking.find({
            $or: [
                { 'contact.name': { $exists: false } },
                { 'contact.name': null },
                { 'contact.name': '' },
                { contact: { $exists: false } }
            ],
            primaryContactId: { $exists: true, $ne: null }
        });

        console.log(`Found ${bookingsToUpdate.length} bookings to backfill.`);

        let updatedCount = 0;
        let failedCount = 0;

        for (const booking of bookingsToUpdate) {
            try {
                const contact = await PrimaryContact.findById(booking.primaryContactId);
                if (contact) {
                    const newContactData = {
                        name: contact.contactName,
                        phone: contact.contactPhoneNo,
                        type: contact.bookingType,
                        interested: contact.requirements,
                    };
                    
                    await Booking.updateOne(
                        { _id: booking._id },
                        { $set: { contact: newContactData } }
                    );
                    
                    updatedCount++;
                    if (updatedCount % 500 === 0) {
                        console.log(`Updated ${updatedCount} bookings...`);
                    }
                } else {
                    failedCount++;
                }
            } catch (err: any) {
                console.error(`Error updating booking ${booking._id}:`, err.message);
                failedCount++;
            }
        }

        console.log(`Backfill complete. Updated: ${updatedCount}. Failed/ContactNotFound: ${failedCount}.`);
        process.exit(0);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

run();
