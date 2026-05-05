"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
const migrate = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CRM3';
    console.log(`Connecting to ${uri} for migration...`);
    try {
        await mongoose_1.default.connect(uri);
        const db = mongoose_1.default.connection.db;
        if (!db)
            throw new Error('DB not found');
        console.log('\n[1/5] Fixing Boolean fields...');
        // notifications.read
        await db.collection('notifications').updateMany({ read: "True" }, { $set: { read: true } });
        await db.collection('notifications').updateMany({ read: "False" }, { $set: { read: false } });
        // primarycontacts.interested
        await db.collection('primarycontacts').updateMany({ interested: "Yes" }, { $set: { interested: true } });
        await db.collection('primarycontacts').updateMany({ interested: "No" }, { $set: { interested: false } });
        // users.isOnline
        await db.collection('users').updateMany({ isOnline: "True" }, { $set: { isOnline: true } });
        await db.collection('users').updateMany({ isOnline: "False" }, { $set: { isOnline: false } });
        // bookings booleans
        await db.collection('bookings').updateMany({ includesFlight: "True" }, { $set: { includesFlight: true } });
        await db.collection('bookings').updateMany({ includesFlight: "False" }, { $set: { includesFlight: false } });
        await db.collection('bookings').updateMany({ includesAdditionalServices: "True" }, { $set: { includesAdditionalServices: true } });
        await db.collection('bookings').updateMany({ includesAdditionalServices: "False" }, { $set: { includesAdditionalServices: false } });
        await db.collection('bookings').updateMany({ verified: "True" }, { $set: { verified: true } });
        await db.collection('bookings').updateMany({ verified: "False" }, { $set: { verified: false } });
        console.log('\n[2/5] Fixing Numeric fields in bookings...');
        const bookings = await db.collection('bookings').find({}).toArray();
        for (const doc of bookings) {
            await db.collection('bookings').updateOne({ _id: doc._id }, {
                $set: {
                    amount: doc.amount ? parseFloat(String(doc.amount)) : 0,
                    totalAmount: doc.totalAmount ? parseFloat(String(doc.totalAmount)) : 0,
                    outstanding: doc.outstanding ? parseFloat(String(doc.outstanding)) : 0,
                    pricePerTicket: doc.pricePerTicket ? parseFloat(String(doc.pricePerTicket)) : 0,
                    travellers: doc.travellers ? parseInt(String(doc.travellers)) : null,
                }
            });
        }
        console.log('\n[3/5] Adding TTL to notifications...');
        const notifications = await db.collection('notifications').find({ expireAt: { $exists: false } }).toArray();
        for (const doc of notifications) {
            const expireAt = new Date((doc.createdAt || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000);
            await db.collection('notifications').updateOne({ _id: doc._id }, { $set: { expireAt } });
        }
        await db.collection('notifications').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, background: true });
        console.log('\n[4/5] Embedding Contact snapshot in bookings...');
        for (const doc of bookings) {
            if (!doc.primaryContactId)
                continue;
            const contact = await db.collection('primarycontacts').findOne({ _id: doc.primaryContactId });
            if (!contact)
                continue;
            await db.collection('bookings').updateOne({ _id: doc._id }, {
                $set: {
                    contact: {
                        name: contact.contactName,
                        phone: contact.contactPhoneNo,
                        type: contact.bookingType,
                    }
                },
                $unset: {
                    contactPerson: "",
                    contactNumber: "",
                }
            });
        }
        console.log('\n[5/5] Creating Unified Timeline (merging comments and activities)...');
        // Ensure timeline collection exists or just use it
        const timelineColl = db.collection('timeline');
        // Migrate comments
        const comments = await db.collection('comments').find({}).toArray();
        for (const doc of comments) {
            await timelineColl.insertOne({
                bookingId: doc.bookingId,
                userId: doc.createdById || doc.userId,
                type: "comment",
                text: doc.text,
                expireAt: new Date((doc.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000),
                createdAt: doc.createdAt || new Date(),
            });
        }
        // Migrate activities
        const activities = await db.collection('activities').find({}).toArray();
        for (const doc of activities) {
            await timelineColl.insertOne({
                bookingId: doc.bookingId,
                userId: doc.userId,
                type: "activity",
                action: doc.action,
                details: doc.details,
                expireAt: new Date((doc.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000),
                createdAt: doc.createdAt || new Date(),
            });
        }
        await timelineColl.createIndex({ bookingId: 1, type: 1, createdAt: -1 }, { background: true });
        await timelineColl.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, background: true });
        console.log('\nMigration complete! You can now drop old collections (comments, activities, travelers) after verifying.');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};
migrate();
