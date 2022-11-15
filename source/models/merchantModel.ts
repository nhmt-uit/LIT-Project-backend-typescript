import mongoose, { Schema } from 'mongoose';
import IMerchant from '../interfaces/merchantInterface';

import logging from '../config/logging';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'merchant';
const MerchantSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        address_1: { type: String },
        address_2: { type: String },
        address_3: { type: String },
        district: { type: String, required: true },
        city: { type: String, required: true },
        email: { type: String, required: true },
        company_id: { type: ObjectId, ref: 'company', require: true },
        type: { type: String, required: true, default: 'Online' },
        avatar: { type: String },
        banner: { type: String },
        website: { type: String }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export default mongoose.model<IMerchant>(collectionName, MerchantSchema, collectionName);
