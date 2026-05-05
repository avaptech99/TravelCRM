import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const runFinalFix = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CRM3';
    console.log(`🚀 Starting Final Redesign Fix on ${uri}...`);

    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        if (!db) throw new Error('DB connection failed');

        // 1. Booking Segments Cast
        console.log('📦 Fixing Booking segments (string "[]" -> array [])...');
        const segmentFix = await db.collection('bookings').updateMany(
            { segments: "[]" },
            { $set: { segments: [] } }
        );
        console.log(`   Done: ${segmentFix.modifiedCount} bookings updated.`);

        // 2. Notification TTL Backfill
        console.log('🔔 Backfilling Notification expireAt (createdAt + 30 days)...');
        // Using aggregation pipeline in update for atomicity if supported, else manual
        const notifications = await db.collection('notifications').find({ expireAt: { $exists: false } }).toArray();
        let nitifUpdated = 0;
        for (const note of notifications) {
            const expireAt = new Date(note.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
            await db.collection('notifications').updateOne({ _id: note._id }, { $set: { expireAt } });
            nitifUpdated++;
        }
        console.log(`   Done: ${nitifUpdated} notifications backfilled.`);

        // 3. User Permissions Migration
        console.log('🔐 Migrating User permissions (Python-dict string -> Object)...');
        const users = await db.collection('users').find({}).toArray();
        let usersUpdated = 0;
        for (const user of users) {
            if (typeof user.permissions === 'string') {
                try {
                    // Extremely naive parser for truncated Python dicts
                    // e.g. "{'leadVisibility': 'all', 'canAssignLeads': True}"
                    let pStr = user.permissions.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false');
                    
                    // Handle truncation: if it doesn't end with }, close it
                    if (!pStr.trim().endsWith('}')) {
                        // Try to find the last complete key-value pair or just append }
                        pStr = pStr.substring(0, pStr.lastIndexOf(',')) + '}';
                    }
                    
                    const parsed = JSON.parse(pStr);
                    const permissions = {
                        leadVisibility: parsed.leadVisibility || 'all',
                        canAssignLeads: !!parsed.canAssignLeads,
                        canEditActualCost: !!parsed.canEditActualCost,
                        canVerifyBookings: !!parsed.canVerifyBookings
                    };
                    
                    await db.collection('users').updateOne({ _id: user._id }, { $set: { permissions } });
                    usersUpdated++;
                } catch (e) {
                    // Fallback to defaults if parsing fails
                    console.warn(`   ⚠️ Could not parse permissions for user ${user.name}, using defaults.`);
                    const permissions = {
                        leadVisibility: 'all',
                        canAssignLeads: user.role === 'ADMIN',
                        canEditActualCost: user.role === 'ADMIN' || user.role === 'ACCOUNT',
                        canVerifyBookings: user.role === 'ADMIN' || user.role === 'ACCOUNT'
                    };
                    await db.collection('users').updateOne({ _id: user._id }, { $set: { permissions } });
                    usersUpdated++;
                }
            } else if (!user.permissions) {
                // Initialize default permissions for users missing them
                const permissions = {
                    leadVisibility: 'all',
                    canAssignLeads: user.role === 'ADMIN',
                    canEditActualCost: user.role === 'ADMIN' || user.role === 'ACCOUNT',
                    canVerifyBookings: user.role === 'ADMIN' || user.role === 'ACCOUNT'
                };
                await db.collection('users').updateOne({ _id: user._id }, { $set: { permissions } });
                usersUpdated++;
            }
        }
        console.log(`   Done: ${usersUpdated} users updated with permissions.`);

        // 4. Collection Cleanup
        console.log('🧹 Cleaning up legacy collections...');
        const collectionsToDrop = ['comments', 'activities', 'travelers'];
        const existingColls = (await db.listCollections().toArray()).map(c => c.name);
        
        for (const coll of collectionsToDrop) {
            if (existingColls.includes(coll)) {
                if (coll === 'activities') {
                    await db.collection(coll).drop();
                    console.log(`   Force Dropped: ${coll} (verified redundant)`);
                } else {
                    const count = await db.collection(coll).countDocuments();
                    if (count > 0) {
                        console.warn(`   ⚠️ Collection ${coll} is NOT empty (${count} docs). Skipping drop for safety.`);
                    } else {
                        await db.collection(coll).drop();
                        console.log(`   Dropped: ${coll}`);
                    }
                }
            } else {
                console.log(`   Skipped: ${coll} (does not exist)`);
            }
        }

        // 5. Verification
        console.log('\n✅ VERIFICATION:');
        const timelineCount = await db.collection('timeline').countDocuments();
        console.log(`   Timeline Count: ${timelineCount}`);
        
        const bookingCount = await db.collection('bookings').countDocuments();
        console.log(`   Total Bookings: ${bookingCount}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during final fix:', err);
        process.exit(1);
    }
};

runFinalFix();
