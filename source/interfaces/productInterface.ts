import { Document, ObjectId } from 'mongoose';

export default interface IProduct extends Document {
    name: string;
    image_0: string;
    image_1: string;
    image_2: string;
    image_3: string;
    image_4: string;
    description: string;
    merchant_id: ObjectId;
    brand_id: ObjectId;
    category_id: ObjectId;
}