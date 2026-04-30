import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICrmSetting extends Document {
    key: string; // e.g. 'companies', 'costTypes', 'costSources', 'groups'
    values: string[];
    updatedAt: Date;
}

const crmSettingSchema = new Schema<ICrmSetting>(
    {
        key: { type: String, required: true, unique: true },
        values: [{ type: String }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const CrmSetting: Model<ICrmSetting> = mongoose.model<ICrmSetting>('CrmSetting', crmSettingSchema);

export default CrmSetting;
