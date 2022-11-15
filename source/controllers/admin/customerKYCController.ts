import { NextFunction, Request, Response } from 'express';
const axios = require('axios');

import CustomerKYC from '../../models/customerKYCModel';

const baseUrl = process.env.ARCHIVE_HOST;

const getAllImagesKYC = async (req: any, res: Response, next: NextFunction) => {
    let { customer_id } = req.query;

    const config_headers = {
        headers: {
            "Authorization": req.headers['authorization'] || ''
        }
    }

    try {
        return axios.post(`${baseUrl}/api/customer_kyc/get_all_image`, { path: `uploads/${customer_id}` }, config_headers)
            .then(async (response: any) => {
                let data = response.data;
                return res.status(200).json({
                    success: true,
                    message: `Get images successful!`,
                    images: data.images,
                })
            })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `Get images fail!`,
            err
        })
    }
};

const confirmCustomerKYC = async (req: any, res: Response, next: NextFunction) => {
    let { customer_id, status } = req.body;

    try {
        return CustomerKYC.updateOne({ customer_id: customer_id }, { status: status })
            .then((response) => {
                return res.status(200).json({
                    success: true,
                    message: `Confirm customer KYC successful!`
                })
            })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: `Confirm customer KYC fail!`,
            err
        })
    }
}

export {
    getAllImagesKYC,
    confirmCustomerKYC
};
