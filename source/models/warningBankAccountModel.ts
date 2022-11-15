import mongoose, { Schema } from 'mongoose';
import IWarningBankAccount from '../interfaces/warningBankAccountInterface';

import logging from '../config/logging';

const collectionName = 'warning_bank_account';
const WarningBankAccountSchema: Schema = new Schema(
    {
        account_holder_name: { type: String, required: true },
        account_number: { type: String, required: true },
        bank_name: { type: String, required: true },
        bank_branch: { type: String, required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        autoCreate: true, // auto create collection
        autoIndex: true, // auto create indexes
    }
);

WarningBankAccountSchema.post<IWarningBankAccount>('save', function () {
    logging.info('Mongo', 'Just saved: ', this);
});

export default mongoose.model<IWarningBankAccount>(collectionName, WarningBankAccountSchema, collectionName);
