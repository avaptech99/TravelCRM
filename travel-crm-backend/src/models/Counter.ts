import mongoose, { Schema, Model } from 'mongoose';

export interface ICounter {
    _id: string; // The name of the sequence
    seq: number; // The current sequence value
}

const counterSchema = new Schema<ICounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

const Counter: Model<ICounter> = mongoose.model<ICounter>('Counter', counterSchema);

export default Counter;
