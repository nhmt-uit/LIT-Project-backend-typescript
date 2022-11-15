import mongoose, { Schema } from 'mongoose';
import ICustomerToken from '../interfaces/customerTokenInterface';

import logging from '../config/logging';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'customer_token';
const CustomerTokenSchema: Schema = new Schema(
    {
        customer_id: { type: ObjectId, unique: true, ref: 'customer', require: true },
        reset_password_token: { type: String, default: '' },
        reset_password_token_expires: { type: Number, default: 0 },
        sms_authentication_code: { type: Number, default: 0 },
        sms_authentication_code_expires: { type: Number, default: 0 },
        email_authentication_token: { type: String, default: '' },
        email_authentication_token_expires: { type: Number, default: 0 },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        autoCreate: true, // auto create collection
        autoIndex: true, // auto create indexes
    },
);

CustomerTokenSchema.index({ customer_id: 1 }, { unique: true })

CustomerTokenSchema.post<ICustomerToken>('save', function () {
    logging.info('Mongo', 'Checkout the customer we just saved: ', this);
});

export default mongoose.model<ICustomerToken>(collectionName, CustomerTokenSchema, collectionName);
