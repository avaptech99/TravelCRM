"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Parse MongoDB Extended JSON
const reviver = (key, value) => {
    if (value && typeof value === 'object') {
        if (value.$oid) {
            return new mongoose_1.default.Types.ObjectId(value.$oid);
        }
        if (value.$date) {
            return new Date(value.$date);
        }
        if (value.$numberInt) {
            return parseInt(value.$numberInt, 10);
        }
        if (value.$numberDouble) {
            return parseFloat(value.$numberDouble);
        }
    }
    return value;
};
const importData = async () => {
    const uri = 'mongodb://adsavap_db_user:8OfdFmOuwihgEjoB@ac-g3tynuf-shard-00-00.wxmise3.mongodb.net:27017,ac-g3tynuf-shard-00-01.wxmise3.mongodb.net:27017,ac-g3tynuf-shard-00-02.wxmise3.mongodb.net:27017/travelCRM?ssl=true&replicaSet=atlas-h96g60-shard-0&authSource=admin&retryWrites=true&w=majority&appName=travelCRM';
    const dataDir = path_1.default.resolve('c:/Users/anmol/OneDrive/Desktop/CRM - Copy/data');
    try {
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose_1.default.connect(uri);
        console.log('Connected to target MongoDB instance.');
        const files = fs_1.default.readdirSync(dataDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            // Filename format: e.g., test.bookings.json. We extract "bookings" as collection name.
            // Usually it's dbname.collection.json
            const parts = file.split('.');
            const collectionName = parts.length >= 3 ? parts[parts.length - 2] : parts[0];
            const filePath = path_1.default.join(dataDir, file);
            console.log(`Reading file: ${filePath}`);
            const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
            const documents = JSON.parse(fileContent, reviver);
            if (!Array.isArray(documents)) {
                console.warn(`Skipping ${file} - not a JSON array.`);
                continue;
            }
            if (documents.length === 0) {
                console.log(`Skipping ${file} - array is empty.`);
                continue;
            }
            console.log(`Importing ${documents.length} documents into '${collectionName}' collection...`);
            const collection = mongoose_1.default.connection.collection(collectionName);
            // We can drop the collection first to start clean, or simply insert.
            // The user wants to insert old data. Since this is a new cluster it's probably empty.
            // Using insertMany.
            try {
                await collection.insertMany(documents);
                console.log(`✅ Successfully imported '${collectionName}'.\n`);
            }
            catch (err) {
                if (err.code === 11000) {
                    console.log(`⚠️  Duplicate keys found in '${collectionName}', trying to insert one by one...`);
                    let inserted = 0;
                    for (const doc of documents) {
                        try {
                            await collection.insertOne(doc);
                            inserted++;
                        }
                        catch (e) {
                            if (e.code !== 11000) {
                                console.error(`Error inserting document into ${collectionName}:`, e);
                            }
                        }
                    }
                    console.log(`✅ Re-inserted ${inserted}/${documents.length} new documents into '${collectionName}'.\n`);
                }
                else {
                    console.error(`❌ Error importing '${collectionName}':`, err);
                }
            }
        }
        console.log('All files processed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};
importData();
