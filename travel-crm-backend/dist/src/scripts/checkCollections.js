"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const run = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || '');
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};
run();
