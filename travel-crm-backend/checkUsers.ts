import mongoose from 'mongoose';

const uri = 'mongodb://adsavap_db_user:8OfdFmOuwihgEjoB@ac-g3tynuf-shard-00-00.wxmise3.mongodb.net:27017,ac-g3tynuf-shard-00-01.wxmise3.mongodb.net:27017,ac-g3tynuf-shard-00-02.wxmise3.mongodb.net:27017/test?ssl=true&replicaSet=atlas-h96g60-shard-0&authSource=admin&retryWrites=true&w=majority&appName=travelCRM';

const checkUsers = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected carefully to check users...');

    // Access the database and collection directly
    const db = mongoose.connection.db;
    
    // List all collections to make sure we imported them to the right DB
    if (db) {
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));

        const usersColl = db.collection('users');
        const count = await usersColl.countDocuments();
        console.log(`Total users in 'users' collection: ${count}`);

        const users = await usersColl.find({}).toArray();
        console.log('Users list:');
        users.forEach(u => {
            console.log(`- Email: ${u.email}, Role: ${u.role}, PasswordHash (length: ${u.passwordHash?.length})`);
        });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkUsers();
