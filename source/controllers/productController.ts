import { NextFunction, Request, Response } from 'express';
const axios = require('axios');

import Product from '../models/productModel';

const baseUrl = process.env.ARCHIVE_HOST;

const getProducts = (req: Request, res: Response, next: NextFunction) => {
    let { id, name, brand_id, category_id } = req.query;
    let query: any = {};

    id ? query._id = id : null;
    name ? query.name = new RegExp(`^${name}$`, 'i') : null;
    brand_id ? query.brand_id = brand_id : null;
    category_id ? query.category_id = category_id : null;

    return Product.find(query)
        .exec()
        .then(async (productExist) => {
            if (productExist.length > 0) {
                const asyncGetProductAvatar = async () => {
                    return Promise.all(productExist.map(async (product: any) => {
                        let paths: any = {};
                        for (let i = 0; i < 5; i++) {
                            if (product[`image_${i}`] !== '') {
                                paths[`image_${i}`] = product[`image_${i}`];
                            }
                        }
                        await axios.post(`${baseUrl}/api/product/get`, { paths: paths })
                            .then(async (response: any) => {
                                let data = response.data;
                                return Object.assign(product, data.images);
                            })
                        return product;
                    }))
                }
                await asyncGetProductAvatar().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Get products successful!",
                        products: productExist
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any products!`
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
    getProducts,
};
