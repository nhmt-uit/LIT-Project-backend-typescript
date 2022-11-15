import { Document, ObjectId } from 'mongoose';

export default interface IBrand extends Document {
    name: string;
    avatar: string;
}