import mongoose, { Schema } from 'mongoose';
import IEvent from '../interfaces/eventInterface';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'event';
const EventSchema: Schema = new Schema(
    {
        event_name: { type: String, required: true },
        start_date: { type: Number, required: true },
        finish_date: { type: Number, required: true },
        approved: { type: Boolean, required: true, default: false },
        image: { type: String },
        html_path: { type: String },
        merchant_id: { type: ObjectId, ref: 'merchant', require: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export default mongoose.model<IEvent>(collectionName, EventSchema, collectionName);