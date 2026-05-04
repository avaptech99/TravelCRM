import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISetting extends Document {
    key: string;
    values: string[];
}

const settingSchema = new Schema<ISetting>(
    {
        key: { type: String, required: true, unique: true },
        values: { type: [String], default: [] },
    },
    {
        timestamps: true,
    }
);

const Setting: Model<ISetting> = mongoose.model<ISetting>('Setting', settingSchema);

export default Setting;
