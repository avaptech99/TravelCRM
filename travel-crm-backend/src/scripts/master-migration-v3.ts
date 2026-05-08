import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking';
import Timeline from '../models/Timeline';
import User from '../models/User';
import path from 'path';

// Load env vars from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MIGRATION_NAME = "MASTER_V3_REDESIGN";

async function runMigration() {
    const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoURI) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    console.log(`\n🚀 Starting Master Migration V3: [${MIGRATION_NAME}]`);
    console.log(`📍 Database: ${mongoURI.split('@').pop()}`);

    try {
        await mongoose.connect(mongoURI);
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection failed");

        // --- PHASE 1: BOOLEAN CONVERSION ---
        console.log('\n--- PHASE 1: Boolean Conversion ---');
        
        const boolSpecs = [
            { coll: 'notifications', field: 'read', trueVal: "True", falseVal: "False" },
            { coll: 'primarycontacts', field: 'interested', trueVal: "Yes", falseVal: "No" },
            { coll: 'users', field: 'isOnline', trueVal: "True", falseVal: "False" },
            { coll: 'bookings', field: 'includesFlight', trueVal: "True", falseVal: "False" },
            { coll: 'bookings', field: 'includesAdditionalServices', trueVal: "True", falseVal: "False" },
            { coll: 'bookings', field: 'verified', trueVal: "True", falseVal: "False" }
        ];

        for (const spec of boolSpecs) {
            const tCount = await db.collection(spec.coll).countDocuments({ [spec.field]: spec.trueVal });
            const fCount = await db.collection(spec.coll).countDocuments({ [spec.field]: spec.falseVal });
            
            if (tCount > 0 || fCount > 0) {
                console.log(`Converting ${spec.coll}.${spec.field}: ${tCount} true, ${fCount} false...`);
                await db.collection(spec.coll).updateMany({ [spec.field]: spec.trueVal }, { $set: { [spec.field]: true } });
                await db.collection(spec.coll).updateMany({ [spec.field]: spec.falseVal }, { $set: { [spec.field]: false } });
                console.log(`✅ ${spec.coll}.${spec.field} converted.`);
            } else {
                console.log(`⏭️ ${spec.coll}.${spec.field} already boolean or no matches.`);
            }
        }

        // --- PHASE 2: NUMERIC CONVERSION ---
        console.log('\n--- PHASE 2: Numeric Conversion ---');
        const bookingsWithStrings = await db.collection('bookings').find({
            $or: [
                { amount: { $type: "string" } },
                { totalAmount: { $type: "string" } },
                { outstanding: { $type: "string" } },
                { pricePerTicket: { $type: "string" } },
                { travellers: { $type: "string" } }
            ]
        }).toArray();

        if (bookingsWithStrings.length > 0) {
            console.log(`Found ${bookingsWithStrings.length} bookings with string numbers. Converting...`);
            const ops = bookingsWithStrings.map(doc => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: {
                        $set: {
                            amount: doc.amount ? parseFloat(doc.amount.toString().replace(/,/g, '')) || 0 : 0,
                            totalAmount: doc.totalAmount ? parseFloat(doc.totalAmount.toString().replace(/,/g, '')) || 0 : 0,
                            outstanding: doc.outstanding ? parseFloat(doc.outstanding.toString().replace(/,/g, '')) || 0 : 0,
                            pricePerTicket: doc.pricePerTicket ? parseFloat(doc.pricePerTicket.toString().replace(/,/g, '')) || 0 : 0,
                            travellers: doc.travellers ? parseInt(doc.travellers.toString()) || 0 : 0
                        }
                    }
                }
            }));
            await db.collection('bookings').bulkWrite(ops);
            console.log(`✅ Booking numeric fields converted.`);
        } else {
            console.log('⏭️ No string numbers found in bookings.');
        }

        // --- PHASE 3: TTL & EXPIRE AT ---
        console.log('\n--- PHASE 3: TTL & ExpireAt Backfill ---');
        
        // Notifications (30 days)
        const unexpiredNotifs = await db.collection('notifications').countDocuments({ expireAt: { $exists: false } });
        if (unexpiredNotifs > 0) {
            console.log(`Backfilling expireAt for ${unexpiredNotifs} notifications...`);
            const notifs = await db.collection('notifications').find({ expireAt: { $exists: false } }).toArray();
            const ops = notifs.map(doc => {
                const createdAt = doc.createdAt || new Date();
                const expireAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                return {
                    updateOne: {
                        filter: { _id: doc._id },
                        update: { $set: { expireAt } }
                    }
                };
            });
            await db.collection('notifications').bulkWrite(ops);
            console.log('✅ Notifications expireAt backfilled.');
        }
        await db.collection('notifications').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expire" });

        // --- PHASE 4: CONTACT SNAPSHOT EMBEDDING ---
        console.log('\n--- PHASE 4: Contact Snapshot Embedding ---');
        const bookingsToEmbed = await db.collection('bookings').find({ 
            contact: { $exists: false },
            primaryContactId: { $exists: true }
        }).toArray();

        if (bookingsToEmbed.length > 0) {
            console.log(`Embedding contact snapshots into ${bookingsToEmbed.length} bookings...`);
            const bulkOps = [];
            for (const doc of bookingsToEmbed) {
                const contact = await db.collection('primarycontacts').findOne({ _id: doc.primaryContactId });
                if (contact) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: {
                                $set: {
                                    contact: {
                                        name: contact.contactName,
                                        phone: contact.contactPhoneNo,
                                        type: contact.bookingType || "Direct (B2C)",
                                        interested: !!contact.interested
                                    }
                                },
                                $unset: {
                                    contactPerson: "",
                                    contactNumber: ""
                                }
                            }
                        }
                    });
                }
            }
            if (bulkOps.length > 0) {
                await db.collection('bookings').bulkWrite(bulkOps);
                console.log(`✅ ${bulkOps.length} bookings updated with contact snapshots.`);
            }
        } else {
            console.log('⏭️ Contact snapshots already embedded or no matches.');
        }

        // --- PHASE 5: TIMELINE CONSOLIDATION ---
        console.log('\n--- PHASE 5: Timeline Consolidation ---');
        
        // Migrate Comments
        const commentCount = await db.collection('comments').countDocuments();
        if (commentCount > 0) {
            console.log(`Migrating ${commentCount} comments to timelines...`);
            const comments = await db.collection('comments').find().toArray();
            const timelineOps = comments.map(c => {
                const expireAt = new Date((c.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000);
                return {
                    bookingId: c.bookingId,
                    userId: c.createdById,
                    type: 'comment',
                    text: c.text,
                    expireAt,
                    createdAt: c.createdAt || new Date(),
                    updatedAt: c.updatedAt || new Date()
                };
            });
            await db.collection('timelines').insertMany(timelineOps);
            console.log(`✅ Comments migrated.`);
        }

        // Migrate Activities
        const activityCount = await db.collection('activities').countDocuments();
        if (activityCount > 0) {
            console.log(`Migrating ${activityCount} activities to timelines...`);
            const activities = await db.collection('activities').find().toArray();
            const timelineOps = activities.map(a => {
                const expireAt = new Date((a.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000);
                return {
                    bookingId: a.bookingId,
                    userId: a.userId,
                    type: 'activity',
                    action: a.action,
                    details: a.details,
                    expireAt,
                    createdAt: a.createdAt || new Date(),
                    updatedAt: a.updatedAt || new Date()
                };
            });
            await db.collection('timelines').insertMany(timelineOps);
            console.log(`✅ Activities migrated.`);
        }

        // --- PHASE 6: INDEX OPTIMIZATION ---
        console.log('\n--- PHASE 6: Index Optimization ---');
        
        console.log('Creating optimized compound indexes on bookings...');
        await db.collection('bookings').createIndex(
            { assignedToUserId: 1, status: 1, lastInteractionAt: -1 },
            { background: true, name: "idx_agent_dashboard_v3" }
        );
        await db.collection('bookings').createIndex(
            { status: 1, travelDate: 1 },
            { background: true, name: "idx_status_traveldate" }
        );
        await db.collection('bookings').createIndex(
            { primaryContactId: 1, createdAt: -1 },
            { background: true, name: "idx_contact_timeline" }
        );
        await db.collection('bookings').createIndex(
            { createdByUserId: 1, createdAt: -1 },
            { background: true, name: "idx_creator_timeline" }
        );
        console.log('✅ New indexes created.');

        // --- PHASE 7: USER PERMISSIONS FIX ---
        console.log('\n--- PHASE 7: User Permissions Fix ---');
        const usersToFix = await db.collection('users').find({
            permissions: { $type: "string" }
        }).toArray();

        if (usersToFix.length > 0) {
            console.log(`Fixing permissions for ${usersToFix.length} users...`);
            for (const user of usersToFix) {
                // Default safe permissions for corrupted strings
                const isAll = user.role === 'ADMIN' || user.role === 'MANAGER';
                await db.collection('users').updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            permissions: {
                                leadVisibility: isAll ? "all" : "own",
                                canAssignLeads: isAll,
                                canEditActualCost: isAll,
                                canVerifyBookings: isAll
                            }
                        }
                    }
                );
            }
            console.log('✅ User permissions fixed.');
        }

        // --- PHASE 8: CLEANUP ---
        console.log('\n--- PHASE 8: Cleanup ---');
        const travellersCount = await db.collection('travelers').countDocuments();
        if (travellersCount === 0) {
            console.log('Dropping empty travelers collection...');
            await db.collection('travelers').drop();
            console.log('✅ travelers collection dropped.');
        }

        console.log(`\n🎉 Migration [${MIGRATION_NAME}] Completed Successfully!`);
        
    } catch (err) {
        console.error(`\n❌ Migration Failed:`, err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runMigration();
