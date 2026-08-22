"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhoneLeadUserId = void 0;
const User_1 = __importDefault(require("../models/User"));
// Cached id of the system "Phone Lead" account used to create call-log bookings
let phoneLeadUserId;
const getPhoneLeadUserId = async () => {
    if (phoneLeadUserId === undefined) {
        const phoneLeadUser = await User_1.default.findOne({ email: 'phone-lead@system.internal' }).select('_id').lean();
        phoneLeadUserId = phoneLeadUser ? phoneLeadUser._id : null;
    }
    return phoneLeadUserId;
};
exports.getPhoneLeadUserId = getPhoneLeadUserId;
