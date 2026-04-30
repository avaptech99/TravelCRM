"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const migratePermissions = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const users = await User_1.default.find({});
        console.log(`Found ${users.length} users. Migrating permissions...`);
        let updatedCount = 0;
        for (const user of users) {
            // Define default permissions based on existing role
            let defaultPermissions = {
                leadVisibility: 'own',
                canAssignLeads: false,
                canEditActualCost: false,
                canVerifyBookings: false,
                canManageUsers: false,
                canViewReports: false,
                featureAccess: {
                    visa: false,
                    ticketing: false,
                    operation: false,
                    account: false,
                }
            };
            if (user.role === 'ADMIN') {
                defaultPermissions = {
                    leadVisibility: 'all',
                    canAssignLeads: true,
                    canEditActualCost: true,
                    canVerifyBookings: true,
                    canManageUsers: true,
                    canViewReports: true,
                    featureAccess: {
                        visa: true,
                        ticketing: true,
                        operation: true,
                        account: true,
                    }
                };
            }
            else if (user.role === 'MARKETER') {
                defaultPermissions.canAssignLeads = true;
                // Marketers typically don't see leads after assignment, so 'none' or 'own' depending on logic.
                defaultPermissions.leadVisibility = 'own';
            }
            else if (user.role === 'AGENT') {
                defaultPermissions.leadVisibility = 'all'; // In old logic, agents could see all bookings, just couldn't access admin stuff
                defaultPermissions.canAssignLeads = true;
            }
            // Only update if permissions object is empty or doesn't have leadVisibility
            if (!user.permissions || !user.permissions.leadVisibility) {
                user.permissions = defaultPermissions;
                await user.save();
                updatedCount++;
                console.log(`Updated user: ${user.email} (${user.role})`);
            }
        }
        console.log(`Migration completed successfully. Updated ${updatedCount} users.`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
};
migratePermissions();
