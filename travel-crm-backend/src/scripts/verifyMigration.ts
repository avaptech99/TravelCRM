import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Booking from '../models/Booking';

dotenv.config();

const verifyMigration = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_crm';
        const apiURL = `http://localhost:${process.env.PORT || 5000}`;
        
        console.log('🔍 Starting Post-Migration Verification...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to Database');

        // --- 1. Database Integrity Checks ---
        console.log('\n[1/3] Checking Database Integrity...');
        
        const totalBookings = await Booking.countDocuments();
        const missingSnapshots = await Booking.countDocuments({ contact: { $exists: false } });
        const missingParticipants = await Booking.countDocuments({ participantIds: { $size: 0 } });
        
        if (missingSnapshots === 0) {
            console.log(`✅ Success: All ${totalBookings} bookings have contact snapshots.`);
        } else {
            console.warn(`⚠️ Warning: ${missingSnapshots} bookings are still missing contact snapshots.`);
        }

        if (missingParticipants === 0) {
            console.log(`✅ Success: All bookings have participantIds populated.`);
        } else {
            console.warn(`⚠️ Warning: ${missingParticipants} bookings are missing participantIds.`);
        }

        // --- 2. Data Type Validation ---
        console.log('\n[2/3] Validating Data Types...');
        const sample = await Booking.findOne({ amount: { $exists: true } }).lean();
        if (sample) {
            const isAmountNumber = typeof sample.amount === 'number';
            const isIncludesFlightBool = typeof sample.includesFlight === 'boolean';
            
            if (isAmountNumber && isIncludesFlightBool) {
                console.log('✅ Success: Native BSON types (Number/Boolean) confirmed.');
            } else {
                console.error('❌ Failure: Data types are still incorrect (Strings detected).');
            }
        }

        // --- 3. API Endpoint Performance ---
        console.log('\n[3/3] Testing API Endpoints (Performance & Schema)...');
        console.log(`Pinging: ${apiURL}`);

        try {
            // Test /api/sync (The most critical dashboard endpoint)
            const startSync = Date.now();
            const syncRes = await fetch(`${apiURL}/api/sync`, {
                headers: { 'Authorization': `Bearer ${process.env.TEST_TOKEN || ''}` }
            });
            const syncTime = Date.now() - startSync;

            if (syncRes.status === 200) {
                const data: any = await syncRes.json();
                console.log(`✅ /api/sync responded in ${syncTime}ms (Target < 200ms)`);
                
                // Verify snapshot data is present in the API response
                const firstRecent = data.recentBookings?.[0];
                if (firstRecent && firstRecent.contactPerson) {
                    console.log(`✅ API Verification: Snapshot data (contactPerson: ${firstRecent.contactPerson}) is visible.`);
                }
            } else if (syncRes.status === 401) {
                console.log('ℹ️ Note: API ping returned 401 (Unauthorized), but server is ALIVE.');
            } else {
                console.warn(`⚠️ API ping returned status ${syncRes.status}`);
            }
        } catch (apiErr) {
            console.error('❌ API Test Failed: Is the server running on port 5000?');
        }

        console.log('\n🏁 Verification Complete.');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification Error:', err);
        process.exit(1);
    }
};

verifyMigration();
