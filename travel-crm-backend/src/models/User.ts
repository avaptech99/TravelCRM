import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserPermissions {
    leadVisibility: 'all' | 'own' | 'none';
    canAssignLeads: boolean;
    canEditActualCost: boolean;
    canVerifyBookings: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    featureAccess: {
        visa: boolean;
        ticketing: boolean;
        operation: boolean;
        account: boolean;
    };
}

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    permissions: IUserPermissions;
    isOnline: boolean;
    lastSeen: Date;
    createdAt: Date;
}

const permissionSchema = new Schema<IUserPermissions>({
    leadVisibility: { type: String, enum: ['all', 'own', 'none'], default: 'own' },
    canAssignLeads: { type: Boolean, default: false },
    canEditActualCost: { type: Boolean, default: false },
    canVerifyBookings: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    featureAccess: {
        visa: { type: Boolean, default: false },
        ticketing: { type: Boolean, default: false },
        operation: { type: Boolean, default: false },
        account: { type: Boolean, default: false },
    }
}, { _id: false });

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, default: 'AGENT' }, // Kept for backward compatibility
        permissions: { type: permissionSchema, default: () => ({}) },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
