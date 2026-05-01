import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env before importing models
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Booking from '../models/Booking';
import PrimaryContact from '../models/PrimaryContact';
import Passenger from '../models/Passenger';
import User from '../models/User';

async function migrate() {
    console.log('--- STARTING MIGRATION ---');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI not found in environment');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('Database connection failed - mongoose.connection.db is undefined');

        const bookings: any[] = await db.collection('bookings').find({}).toArray();
        console.log(`Found ${bookings.length} bookings to migrate.`);

        for (const booking of bookings) {
            console.log(`Migrating booking ID: ${booking._id}`);

            // 1. Create Primary Contact
            // Note: Legacy fields were 'contactPerson' and 'contactNumber'
            const contact = await PrimaryContact.create({
                contactName: booking.contactPerson || 'Unknown Contact',
                contactPhoneNo: booking.contactNumber || booking.contactPhoneNo || '0000000000',
                requirements: booking.requirements || '',
                interested: booking.interested || 'No',
            });

            // 2. Extract flight info from legacy travelers if available
            let flightFrom = '';
            let flightTo = '';
            let tripType: 'one-way' | 'round-trip' = 'one-way';
            let amount = booking.totalAmount || 0;

            if (booking.travelers && booking.travelers.length > 0) {
                const primary = booking.travelers[0];
                flightFrom = primary.flightFrom || '';
                flightTo = primary.flightTo || '';
                tripType = primary.tripType || 'one-way';
                
                // If totalAmount was missing, try to calculate from pricePerTicket
                if (!amount && primary.pricePerTicket) {
                    amount = primary.pricePerTicket * booking.travelers.length;
                }
            }

            // 3. Update Booking
            await Booking.findByIdAndUpdate(booking._id, {
                primaryContactId: contact._id,
                flightFrom,
                flightTo,
                tripType,
                amount,
            });

            // 4. Migrate travelers to Passengers
            if (booking.travelers && Array.isArray(booking.travelers)) {
                for (const t of booking.travelers) {
                    await Passenger.create({
                        name: t.name || 'Unknown Passenger',
                        phoneNumber: t.phone || '',
                        email: t.email || '',
                        dob: t.dob,
                        anniversary: t.anniversary,
                        bookingId: booking._id,
                    });
                }
            }
        }

        console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
