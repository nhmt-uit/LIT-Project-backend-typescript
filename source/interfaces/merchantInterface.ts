import { Document, ObjectId } from 'mongoose';

export default interface IBankAccount extends Document {
    name: string;
    address_1: string;
    address_2: string;
    address_3: string;
    district: string;
    city: string;
    email: string;
    company_id: ObjectId;
    type: boolean;
    avatar: string;
    banner: string;
    website: string;
}