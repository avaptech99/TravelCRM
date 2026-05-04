import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    groups: string[];
    isOnline: boolean;
    lastSeen: Date;
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
        createdAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
