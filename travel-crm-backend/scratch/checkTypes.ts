import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkDataTypes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const booking = await mongoose.connection.db.collection('bookings').findOne({});
        console.log('Booking Document:', JSON.stringify(booking, null, 2));
        if (booking) {
            console.log('Types:');
            console.log('amount:', typeof booking.amount);
            console.log('totalAmount:', typeof booking.totalAmount);
            console.log('outstanding:', typeof booking.outstanding);
            console.log('includesFlight:', typeof booking.includesFlight);
            console.log('contact.interested:', typeof booking.contact?.interested);
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

checkDataTypes();
