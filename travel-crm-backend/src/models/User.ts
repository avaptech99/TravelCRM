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

// Pre-find hook to start timer
userSchema.pre(/^find/, function () {
    (this as any)._queryStart = Date.now();
});

// Post-find hook to log slow queries
userSchema.post(/^find/, function () {
    const duration = Date.now() - (this as any)._queryStart;
    if (duration > 100) {
        console.log(`[MONGOOSE SLOW] User.${(this as any).op} - ${duration}ms | filter: ${JSON.stringify((this as any)._conditions)}`);
    }
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
