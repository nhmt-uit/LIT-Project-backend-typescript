import mongoose, { Schema } from 'mongoose';
import IBrand from '../interfaces/brandInterface';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'brand';
const BrandSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        avatar: { type: String },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export default mongoose.model<IBrand>(collectionName, BrandSchema, collectionName);
