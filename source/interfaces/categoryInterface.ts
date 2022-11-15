import { Document, ObjectId } from 'mongoose';

export default interface ICategory extends Document {
    en_name: string;
    vn_name: string;
    parent_id: ObjectId;
    priority: number;
}