const mongoose = require('mongoose');
const path = require('path');

// Dynamically require the model (assuming it's in the dist folder if built, or src with ts-node)
// For simplicity, let's try to connect and run raw mongo commands if possible, or use the JS model
async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/crm');
        console.log('Connected to MongoDB');
        
        const stats = await mongoose.connection.db.collection('bookings').aggregate([
            { $group: { _id: '$assignedToUserId', count: { $sum: 1 } } }
        ]).toArray();
        
        console.log('Assignment Stats:');
        console.log(JSON.stringify(stats, null, 2));
        
        // Also check users
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('\nUsers in DB:');
        users.forEach(u => console.log(`${u._id} - ${u.name} - ${u.email}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
