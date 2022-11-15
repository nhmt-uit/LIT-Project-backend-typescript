import { Document, ObjectId } from 'mongoose';

export default interface ICustomerToken extends Document {
    customer_id: ObjectId;
    reset_password_token: string;
    reset_password_token_expires: number;
    sms_authentication_code: number;
    sms_authentication_code_expires: number;
    email_authentication_token: string;
    email_authentication_token_expires: number;
}