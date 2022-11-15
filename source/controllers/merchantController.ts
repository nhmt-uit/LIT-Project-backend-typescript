import { NextFunction, Request, Response } from 'express';
const axios = require('axios');

import Merchant from '../models/merchantModel';

const baseUrl = process.env.ARCHIVE_HOST;

const getMerchants = (req: Request, res: Response, next: NextFunction) => {
    let { name } = req.query;
    let query: any = {};
    if (name) {
        query.name = new RegExp(`^${name}$`, 'i');
    }

    return Merchant.find(query, { website: 0, banner: 0 }).populate('company_id', { name: 1 })
        .exec()
        .then(async (merchantExist) => {
            if (merchantExist.length > 0) {
                const asyncGetMerchantAvatar = async () => {
                    return Promise.all(merchantExist.map(async (merchant: any) => {
                        if (merchant.avatar !== '') {
                            await axios.post(`${baseUrl}/api/merchant/get`, { path: merchant.avatar })
                                .then(async (response: any) => {
                                    let data = response.data;
                                    merchant.avatar = data.image;
                                    return merchant;
                                })
                        }
                        return merchant;
                    }))
                }
                await asyncGetMerchantAvatar().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Get merchants successful!",
                        merchants: merchantExist
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any merchants!`
                })
            }
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

const getMerchantsSlider = (req: Request, res: Response, next: NextFunction) => {
    let { name } = req.query;
    let query: any = {};
    if (name) {
        query.name = name;
    }

    return Merchant.find(query, { website: 1, banner: 1 })
        .exec()
        .then(async (merchantExist) => {
            if (merchantExist.length > 0) {
                const asyncGetMerchantBanner = async () => {
                    return Promise.all(merchantExist.map(async (merchant: any) => {
                        if (merchant.banner !== '') {
                            await axios.post(`${baseUrl}/api/merchant/get`, { path: merchant.banner })
                                .then(async (response: any) => {
                                    let data = response.data;
                                    merchant.banner = data.image;
                                    return merchant;
                                })
                        }
                        return merchant;
                    }))
                }
                await asyncGetMerchantBanner().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Get merchants successful!",
                        merchants: merchantExist
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any merchants!`
                })
            }
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

export {
    getMerchants,
    getMerchantsSlider
};
