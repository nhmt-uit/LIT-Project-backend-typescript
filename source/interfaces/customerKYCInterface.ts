import { Document, ObjectId } from 'mongoose';

export default interface ICustomerKYC extends Document {
    customer_id: ObjectId;
    portrait_image_path: string;
    front_side_of_id_card_path: string;
    back_side_of_id_card_path: string;
    status: boolean;
}