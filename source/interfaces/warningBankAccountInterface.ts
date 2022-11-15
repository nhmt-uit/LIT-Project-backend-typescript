import { Document, ObjectId } from 'mongoose';

export default interface IWarningBankAccount extends Document {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    bank_branch: string;
}