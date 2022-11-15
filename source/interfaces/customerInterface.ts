import { Document } from 'mongoose';

export default interface ICustomer extends Document {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    address: string;
    phone_number: string;
    confirmed_email: boolean;
    confirmed_phone_number: boolean;
    refresh_token: string;
}