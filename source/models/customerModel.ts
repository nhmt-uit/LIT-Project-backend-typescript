import mongoose, { Schema } from 'mongoose';
import ICustomer from '../interfaces/customerInterface';

import logging from '../config/logging';

const collectionName = 'customer';
const CustomerSchema: Schema = new Schema(
    {
        email: { type: String, unique: true, required: true, trim: true },
        password: { type: String, required: true, trim: true, minlength: 6 },
        first_name: { type: String, required: true, trim: true },
        last_name: { type: String, required: true, trim: true },
        address: { type: String, required: true },
        phone_number: { type: String, required: true },
        confirmed_email: { type: Boolean, default: false },
        confirmed_phone_number: { type: Boolean, default: false },
        refresh_token: { type: String, default: '' }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        autoCreate: true, // auto create collection
        autoIndex: true, // auto create indexes
    }
);

CustomerSchema.index({ email: 1 }, { unique: true })
CustomerSchema.index({ phone_number: 1 }, { unique: true })

CustomerSchema.post<ICustomer>('save', function () {
    logging.info('Mongo', 'Checkout the customer we just saved: ', this);
});

export default mongoose.model<ICustomer>(collectionName, CustomerSchema, collectionName);
