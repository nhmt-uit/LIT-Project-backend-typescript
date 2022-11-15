import { NextFunction, Request, Response } from 'express';
const axios = require('axios');

import Brand from '../models/brandModel';

const baseUrl = process.env.ARCHIVE_HOST;

const getBrands = (req: Request, res: Response, next: NextFunction) => {
    let { name } = req.query;
    let query: any = {};
    if (name) {
        query.name = new RegExp(`^${name}$`, 'i');
    }

    return Brand.find(query)
        .exec()
        .then(async (brandExist) => {
            if (brandExist.length > 0) {
                const asyncGetBrandAvatar = async () => {
                    return Promise.all(brandExist.map(async (brand: any) => {
                        if (brand.avatar !== '') {
                            await axios.post(`${baseUrl}/api/brand/get`, { path: brand.avatar })
                                .then(async (response: any) => {
                                    let data = response.data;
                                    brand.avatar = data.image;
                                    return brand;
                                })
                        }
                        return brand;
                    }))
                }
                await asyncGetBrandAvatar().then(() => {
                    return res.status(201).json({
                        success: true,
                        message: "Get brands successful!",
                        brands: brandExist
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any brands!`
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
    getBrands,
};
