import mongoose from 'mongoose';
import User from '../models/User';

// Cached id of the system "Phone Lead" account used to create call-log bookings
let phoneLeadUserId: mongoose.Types.ObjectId | null | undefined;

export const getPhoneLeadUserId = async (): Promise<mongoose.Types.ObjectId | null> => {
    if (phoneLeadUserId === undefined) {
        const phoneLeadUser = await User.findOne({ email: 'phone-lead@system.internal' }).select('_id').lean();
        phoneLeadUserId = phoneLeadUser ? (phoneLeadUser._id as mongoose.Types.ObjectId) : null;
    }
    return phoneLeadUserId;
};
