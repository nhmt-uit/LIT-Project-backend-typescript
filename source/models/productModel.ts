import mongoose, { Schema } from 'mongoose';
import IProduct from '../interfaces/productInterface';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'product';
const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        image_0: { type: String, required: true },
        image_1: { type: String },
        image_2: { type: String },
        image_3: { type: String },
        image_4: { type: String },
        description: { type: String, required: true },
        merchant_id: { type: ObjectId, ref: 'merchant', require: true },
        brand_id: { type: ObjectId, ref: 'brand', require: true },
        category_id: { type: ObjectId, ref: 'category', require: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export default mongoose.model<IProduct>(collectionName, ProductSchema, collectionName);
