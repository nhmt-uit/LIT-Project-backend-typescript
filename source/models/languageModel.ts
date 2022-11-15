import mongoose, { Schema } from 'mongoose';
import ILanguage from '../interfaces/languageInterface';

const collectionName = 'language';
const LanguageSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true },
        vietnamese: { type: String, required: true },
        english: { type: String, required: true },
        chinese: { type: String, required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export default mongoose.model<ILanguage>(collectionName, LanguageSchema, collectionName);
