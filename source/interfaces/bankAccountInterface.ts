import { Document, ObjectId } from 'mongoose';

export default interface IBankAccount extends Document {
    customer_id: ObjectId;
    nickname: string;
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    bank_branch: string;
    duplication: boolean;
    duplicate_info: string;
}