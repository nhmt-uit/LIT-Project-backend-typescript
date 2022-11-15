import { Document, ObjectId } from 'mongoose';

export default interface IEvent extends Document {
    event_name: string;
    start_date: number;
    finish_date: number;
    approved: boolean;
    image: string;
    html_path: string;
    merchant_id: ObjectId;
}