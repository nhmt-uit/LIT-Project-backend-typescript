import mongoose, { Schema } from 'mongoose';
import IUser from '../interfaces/userInterface';

import logging from '../config/logging';

const collectionName = 'user';
const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, unique: true, required: true, trim: true },
        password: { type: String, required: true, trim: true, minlength: 6 },
        role: { type: String, required: true },
        refresh_token: { type: String, default: '' }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        autoCreate: true, // auto create collection
        autoIndex: true, // auto create indexes
    }
);

UserSchema.index({ email: 1 }, { unique: true })

UserSchema.post<IUser>('save', function () {
    logging.info('Mongo', 'Checkout the user we just saved: ', this);
});

export default mongoose.model<IUser>(collectionName, UserSchema, collectionName);
