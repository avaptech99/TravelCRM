import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import Contact from './src/models/Contact';
import Booking from './src/models/Booking';
import Segment from './src/models/Segment';
import User from './src/models/User';

async function test() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('Connected');

    try {
        const contactPerson = "Anmoldeep Singh";
        const contactNumber = "9779344972";
        const requirements = "xrdctfyvgbhj";
        const assignedGroup = "Default (Package / LCC)";
        
        const contact = await Contact.create({
            contactName: contactPerson,
            contactPhoneNo: contactNumber,
            bookingType: 'Direct (B2C)',
            requirements: requirements,
            status: 'Pending',
            assignedToUserId: null,
            assignedGroup: assignedGroup,
        });
        
        console.log('Contact created', contact._id);

        const booking = await Booking.create({
            contactId: contact._id,
            tripType: 'one-way',
            lumpSumAmount: 0,
            createdByUserId: contact._id, // simulate req.user.id
            assignedToUserId: null,
            includesFlight: true,
            includesAdditionalServices: false,
            additionalServicesDetails: null,
            companyName: null,
        });

        console.log('Booking created', booking._id);

    } catch (e: any) {
        console.error('ERROR:', e.message);
        if (e.errors) {
            for (let key in e.errors) {
                console.error('Validation error on', key, ':', e.errors[key].message);
            }
        }
    } finally {
        await mongoose.disconnect();
    }
}

test();
