import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    groups: string[];
    isOnline: boolean;
    lastSeen: Date;
    permissions: {
        leadVisibility: 'own' | 'all';
        canAssignLeads: boolean;
        canEditActualCost: boolean;
        canVerifyBookings: boolean;
    };
    createdAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, default: 'AGENT' },
        groups: { type: [String], default: [] },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        permissions: {
            leadVisibility: { type: String, enum: ['own', 'all'], default: 'own' },
            canAssignLeads: { type: Boolean, default: false },
            canEditActualCost: { type: Boolean, default: false },
            canVerifyBookings: { type: Boolean, default: false },
        },
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
