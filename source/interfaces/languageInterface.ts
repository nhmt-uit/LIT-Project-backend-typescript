import { Document } from 'mongoose';

export default interface IUser extends Document {
    key: string;
    vietnamese: string;
    english: string;
    chinese: string;
}