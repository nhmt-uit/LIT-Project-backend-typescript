import mongoose, { Schema } from 'mongoose';
import ICategory from '../interfaces/categoryInterface';

import logging from '../config/logging';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'category';
const CategorySchema: Schema = new Schema(
    {
        en_name: { type: String, unique: true, required: true },
        vn_name: { type: String, unique: true, required: true },
        parent_id: { type: ObjectId, require: true },
        priority: { type: Number, required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

CategorySchema.post<ICategory>('save', function () {
    logging.info('Mongo', 'We just saved: ', this);
});

export default mongoose.model<ICategory>(collectionName, CategorySchema, collectionName);
