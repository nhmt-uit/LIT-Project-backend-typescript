import { AnySoaRecord } from 'dns';
import { NextFunction, Request, Response } from 'express';
const _ = require('lodash');

import BankAccount from '../../models/bankAccountModel';

const getDuplicateBankAccount = (req: Request, res: Response, next: NextFunction) => {
    let removed_fields_bank_account = { created_at: 0, updated_at: 0, duplication: 0 }
    let removed_fields_customer = { confirmed_email: 0, confirmed_phone_number: 0, refresh_token: 0, password: 0, updated_at: 0, created_at: 0 }

    try {
        BankAccount.find({ duplication: true }, removed_fields_bank_account).populate('customer_id', removed_fields_customer)
            .exec()
            .then(async (data) => {
                let result_data: any = {};
                const asyncHandleData = async () => {
                    return Promise.all(data.map(async (item: any) => {
                        result_data[item.duplicate_info] = result_data[item.duplicate_info] ? result_data[item.duplicate_info] : JSON.parse(JSON.stringify(item));
                        let array_customer_duplicate = result_data[item.duplicate_info]['customer_duplicate'] || [];
                        array_customer_duplicate.push(item.customer_id);
                        result_data[item.duplicate_info]['customer_duplicate'] = array_customer_duplicate;
                        delete result_data[item.duplicate_info]['customer_id'];
                    }))
                }

                asyncHandleData().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: `Get duplicate bank account successful!`,
                        result_data: Object.values(result_data)
                    });
                })
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            err
        });
    }
};

export {
    getDuplicateBankAccount
};
