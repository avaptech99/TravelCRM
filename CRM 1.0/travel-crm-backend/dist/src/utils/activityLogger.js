"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
const logActivity = async (bookingId, userId, action, details) => {
    try {
        await Activity_1.default.create({
            bookingId,
            userId,
            action,
            details,
        });
        console.log(`[ACTIVITY LOG] ${action} for booking ${bookingId}`);
    }
    catch (error) {
        console.error(`[ACTIVITY LOG ERROR] ${error}`);
    }
};
exports.logActivity = logActivity;
