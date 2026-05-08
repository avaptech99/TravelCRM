/**
 * Master Migration V3 - mongosh Compatible
 * 
 * Instructions:
 * 1. Connect to your Atlas cluster via mongosh
 * 2. Run: load("master-migration-v3-mongosh.js")
 * or copy-paste the content into the shell.
 */

const MIGRATION_NAME = "MASTER_V3_REDESIGN_MONGOSH";

function runMigration() {
    print(`\n🚀 Starting Master Migration V3: [${MIGRATION_NAME}]`);
    print(`📍 Database: ${db.getName()}`);

    // --- PHASE 1: BOOLEAN CONVERSION ---
    print('\n--- PHASE 1: Boolean Conversion ---');
    
    const boolSpecs = [
        { coll: 'notifications', field: 'read', trueVal: "True", falseVal: "False" },
        { coll: 'primarycontacts', field: 'interested', trueVal: "Yes", falseVal: "No" },
        { coll: 'users', field: 'isOnline', trueVal: "True", falseVal: "False" },
        { coll: 'bookings', field: 'includesFlight', trueVal: "True", falseVal: "False" },
        { coll: 'bookings', field: 'includesAdditionalServices', trueVal: "True", falseVal: "False" },
        { coll: 'bookings', field: 'verified', trueVal: "True", falseVal: "False" }
    ];

    boolSpecs.forEach(spec => {
        const tCount = db.getCollection(spec.coll).countDocuments({ [spec.field]: spec.trueVal });
        const fCount = db.getCollection(spec.coll).countDocuments({ [spec.field]: spec.falseVal });
        
        if (tCount > 0 || fCount > 0) {
            print(`Converting ${spec.coll}.${spec.field}: ${tCount} true, ${fCount} false...`);
            db.getCollection(spec.coll).updateMany({ [spec.field]: spec.trueVal }, { $set: { [spec.field]: true } });
            db.getCollection(spec.coll).updateMany({ [spec.field]: spec.falseVal }, { $set: { [spec.field]: false } });
            print(`✅ ${spec.coll}.${spec.field} converted.`);
        } else {
            print(`⏭️ ${spec.coll}.${spec.field} already boolean or no matches.`);
        }
    });

    // --- PHASE 2: NUMERIC CONVERSION ---
    print('\n--- PHASE 2: Numeric Conversion ---');
    const bookingsWithStrings = db.bookings.find({
        $or: [
            { amount: { $type: "string" } },
            { totalAmount: { $type: "string" } },
            { outstanding: { $type: "string" } },
            { pricePerTicket: { $type: "string" } },
            { travellers: { $type: "string" } }
        ]
    }).toArray();

    if (bookingsWithStrings.length > 0) {
        print(`Found ${bookingsWithStrings.length} bookings with string numbers. Converting...`);
        const ops = bookingsWithStrings.map(doc => {
            const cleanNum = (val) => {
                if (!val) return 0;
                return parseFloat(val.toString().replace(/,/g, '')) || 0;
            };
            return {
                updateOne: {
                    filter: { _id: doc._id },
                    update: {
                        $set: {
                            amount: cleanNum(doc.amount),
                            totalAmount: cleanNum(doc.totalAmount),
                            outstanding: cleanNum(doc.outstanding),
                            pricePerTicket: cleanNum(doc.pricePerTicket),
                            travellers: doc.travellers ? parseInt(doc.travellers.toString()) || 0 : 0
                        }
                    }
                }
            };
        });
        db.bookings.bulkWrite(ops);
        print(`✅ Booking numeric fields converted.`);
    } else {
        print('⏭️ No string numbers found in bookings.');
    }

    // --- PHASE 3: TTL & EXPIRE AT ---
    print('\n--- PHASE 3: TTL & ExpireAt Backfill ---');
    
    // Notifications (30 days)
    const unexpiredNotifsCount = db.notifications.countDocuments({ expireAt: { $exists: false } });
    if (unexpiredNotifsCount > 0) {
        print(`Backfilling expireAt for ${unexpiredNotifsCount} notifications...`);
        const notifs = db.notifications.find({ expireAt: { $exists: false } }).toArray();
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
        db.notifications.bulkWrite(ops);
        print('✅ Notifications expireAt backfilled.');
    }
    db.notifications.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expire" });

    // --- PHASE 4: CONTACT SNAPSHOT EMBEDDING ---
    print('\n--- PHASE 4: Contact Snapshot Embedding ---');
    const bookingsToEmbed = db.bookings.find({ 
        contact: { $exists: false },
        primaryContactId: { $exists: true }
    }).toArray();

    if (bookingsToEmbed.length > 0) {
        print(`Embedding contact snapshots into ${bookingsToEmbed.length} bookings...`);
        const bulkOps = [];
        bookingsToEmbed.forEach(doc => {
            const contact = db.primarycontacts.findOne({ _id: doc.primaryContactId });
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
        });
        if (bulkOps.length > 0) {
            db.bookings.bulkWrite(bulkOps);
            print(`✅ ${bulkOps.length} bookings updated with contact snapshots.`);
        }
    } else {
        print('⏭️ Contact snapshots already embedded or no matches.');
    }

    // --- PHASE 5: TIMELINE CONSOLIDATION ---
    print('\n--- PHASE 5: Timeline Consolidation ---');
    
    // Migrate Comments
    const commentCount = db.comments.countDocuments();
    if (commentCount > 0) {
        print(`Migrating ${commentCount} comments to timelines...`);
        const comments = db.comments.find().toArray();
        const timelineOps = comments.map(c => {
            const expireAt = new Date((c.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000);
            return {
                bookingId: c.bookingId,
                userId: c.createdById,
                type: 'comment',
                text: c.text,
                expireAt: expireAt,
                createdAt: c.createdAt || new Date(),
                updatedAt: c.updatedAt || new Date()
            };
        });
        db.timelines.insertMany(timelineOps);
        print(`✅ Comments migrated.`);
    }

    // Migrate Activities
    const activityCount = db.activities.countDocuments();
    if (activityCount > 0) {
        print(`Migrating ${activityCount} activities to timelines...`);
        const activities = db.activities.find().toArray();
        const timelineOps = activities.map(a => {
            const expireAt = new Date((a.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000);
            return {
                bookingId: a.bookingId,
                userId: a.userId,
                type: 'activity',
                action: a.action,
                details: a.details,
                expireAt: expireAt,
                createdAt: a.createdAt || new Date(),
                updatedAt: a.updatedAt || new Date()
            };
        });
        db.timelines.insertMany(timelineOps);
        print(`✅ Activities migrated.`);
    }
    db.timelines.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expire" });
    db.timelines.createIndex({ bookingId: 1, createdAt: -1 }, { name: "idx_booking_timeline" });

    // --- PHASE 6: INDEX OPTIMIZATION ---
    print('\n--- PHASE 6: Index Optimization ---');
    
    print('Creating optimized compound indexes on bookings...');
    db.bookings.createIndex(
        { assignedToUserId: 1, status: 1, lastInteractionAt: -1 },
        { background: true, name: "idx_agent_dashboard_v3" }
    );
    db.bookings.createIndex(
        { status: 1, travelDate: 1 },
        { background: true, name: "idx_status_traveldate" }
    );
    db.bookings.createIndex(
        { primaryContactId: 1, createdAt: -1 },
        { background: true, name: "idx_contact_timeline" }
    );
    db.bookings.createIndex(
        { createdByUserId: 1, createdAt: -1 },
        { background: true, name: "idx_creator_timeline" }
    );
    print('✅ New indexes created.');

    // --- PHASE 7: USER PERMISSIONS FIX ---
    print('\n--- PHASE 7: User Permissions Fix ---');
    const usersToFix = db.users.find({
        permissions: { $type: "string" }
    }).toArray();

    if (usersToFix.length > 0) {
        print(`Fixing permissions for ${usersToFix.length} users...`);
        usersToFix.forEach(user => {
            const isAll = user.role === 'ADMIN' || user.role === 'MANAGER';
            db.users.updateOne(
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
        });
        print('✅ User permissions fixed.');
    }

    // --- PHASE 8: CLEANUP ---
    print('\n--- PHASE 8: Cleanup ---');
    if (db.getCollectionNames().includes('travelers')) {
        const travellersCount = db.travelers.countDocuments();
        if (travellersCount === 0) {
            print('Dropping empty travelers collection...');
            db.travelers.drop();
            print('✅ travelers collection dropped.');
        }
    }

    print(`\n🎉 Migration [${MIGRATION_NAME}] Completed Successfully!`);
}

runMigration();
