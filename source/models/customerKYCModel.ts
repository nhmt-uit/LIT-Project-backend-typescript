import mongoose, { Schema } from 'mongoose';
import ICustomerKYC from '../interfaces/customerKYCInterface';

import logging from '../config/logging';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'customer_kyc';
const CustomerKYCSchema: Schema = new Schema(
    {
        customer_id: { type: ObjectId, unique: true, ref: 'customer', require: true },
        portrait_image_path: { type: String, default: "" },
        front_side_of_id_card_path: { type: String, default: "" },
        back_side_of_id_card_path: { type: String, default: "" },
        status: { type: Boolean, default: false },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        autoCreate: true, // auto create collection
        autoIndex: true, // auto create indexes
    }
);

CustomerKYCSchema.index({ customer_id: 1 }, { unique: true })

CustomerKYCSchema.post<ICustomerKYC>('save', function () {
    logging.info('Mongo', 'Checkout the customer_kyc we just saved: ', this);
});

export default mongoose.model<ICustomerKYC>(collectionName, CustomerKYCSchema, collectionName);
