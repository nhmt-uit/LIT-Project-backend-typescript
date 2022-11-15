import mongoose, { Schema } from 'mongoose';
import IBankAccount from '../interfaces/bankAccountInterface';

import logging from '../config/logging';

let ObjectId = Schema.Types.ObjectId;
const collectionName = 'bank_account';
const BankAccountSchema: Schema = new Schema(
    {
        customer_id: { type: ObjectId, ref: 'customer', require: true },
        nickname: { type: String, required: true },
        account_holder_name: { type: String, required: true },
        account_number: { type: String, required: true },
        bank_name: { type: String, required: true },
        bank_branch: { type: String, required: true },
        duplication: { type: Boolean, default: false },
        duplicate_info: { type: String },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        autoCreate: true, // auto create collection
        autoIndex: true, // auto create indexes
    }
);

// BankAccountSchema.index({ customer_id: 1 }, { unique: true })

BankAccountSchema.post<IBankAccount>('save', function () {
    logging.info('Mongo', 'Checkout the customer we just saved: ', this);
});

export default mongoose.model<IBankAccount>(collectionName, BankAccountSchema, collectionName);
