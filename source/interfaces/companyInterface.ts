import { Document, ObjectId } from 'mongoose';

export default interface ICompany extends Document {
    name: string;
    avatar: string;
}