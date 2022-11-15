import mongoose, { Schema } from 'mongoose';
import ICompany from '../interfaces/companyInterface';

import logging from '../config/logging';

const collectionName = 'company';
const CompanySchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        avatar: { type: String },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export default mongoose.model<ICompany>(collectionName, CompanySchema, collectionName);
