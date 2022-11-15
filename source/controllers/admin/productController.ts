import { NextFunction, Request, Response } from 'express';
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

import Product from '../../models/productModel';

const baseUrl = process.env.ARCHIVE_HOST;

// Setup Storage
const storage = multer.diskStorage({
    destination: function (req: any, file: any, callback: (arg0: null, arg1: string) => void) {
        // Set the destination where the files should be stored on disk
        callback(null, "uploads");
    },
    filename: function (req: any, file: { originalname: string; }, callback: (arg0: null, arg1: string) => void) {
        // Set the file name on the file in the uploads folder
        callback(null, Date.now() + "-" + file.originalname);
    },
    fileFilter: function (req: any, file: { mimetype: string; }, callback: (arg0: Error | null, arg1: boolean) => void) {
        // Check type file
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
            return callback(new Error('Only Images are allowed !'), false)
        }
        callback(null, true);
    }
});

const upload = multer({ storage: storage }).fields([{ name: 'image_0' }, { name: 'image_1' }, { name: 'image_2' }, { name: 'image_3' }, { name: 'image_4' }]);

const createProduct = (req: any, res: Response, next: NextFunction) => {
    // Create Upload Folder
    if (!fs.existsSync(`uploads`)) {
        fs.mkdirSync(`uploads`)
    }
    upload(req, res, async function (err: any) {
        if (!req.files) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let params = req.body;
        let image_0 = req.files.image_0 && req.files.image_0[0];
        let image_1 = req.files.image_1 && req.files.image_1[0];
        let image_2 = req.files.image_2 && req.files.image_2[0];
        let image_3 = req.files.image_3 && req.files.image_3[0];
        let image_4 = req.files.image_4 && req.files.image_4[0];

        return Product.findOne({ brand_id: params.brand_id, name: params.name })
            .exec()
            .then((productExist) => {
                if (!productExist) {
                    // Prepair to send and save product images.
                    let formData = new FormData();
                    formData.append('image_0', fs.createReadStream(image_0.path), { filename: `${params.name}-image_0-` + image_0.originalname });
                    image_1 ? formData.append('image_1', fs.createReadStream(image_1.path), { filename: `${params.name}-image_1-` + image_1.originalname }) : null;
                    image_2 ? formData.append('image_2', fs.createReadStream(image_2.path), { filename: `${params.name}-image_2-` + image_2.originalname }) : null;
                    image_3 ? formData.append('image_3', fs.createReadStream(image_3.path), { filename: `${params.name}-image_3-` + image_3.originalname }) : null;
                    image_4 ? formData.append('image_4', fs.createReadStream(image_4.path), { filename: `${params.name}-image_4-` + image_4.originalname }) : null;
                    formData.append('brand_id', params.brand_id);
                    formData.append('product_name', params.name);

                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/product/save`, formData, config_headers)
                        .then(async (response: any) => {
                            params.image_0 = response.data.images.image_0;
                            params.image_1 = response.data.images.image_1;
                            params.image_2 = response.data.images.image_2;
                            params.image_3 = response.data.images.image_3;
                            params.image_4 = response.data.images.image_4;

                            const product = new Product(params);
                            return product.save((error, result) => {
                                if (error) {
                                    return res.json({
                                        error
                                    })
                                }
                                return res.status(201).json({
                                    success: true,
                                    message: "Create product successful!",
                                    product: result
                                })
                            })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Product name has been used!`
                    })
                }
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            }).finally(() => {
                fs.unlinkSync(image_0.path);
                fs.unlinkSync(image_1.path);
                fs.unlinkSync(image_2.path);
                fs.unlinkSync(image_3.path);
                fs.unlinkSync(image_4.path);
            });
    })
};

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

const updateProduct = (req: any, res: Response, next: NextFunction) => {
    upload(req, res, async function (err: any) {
        if (!req.files) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let params = req.body;
        let image_0 = req.files.image_0 && req.files.image_0[0];
        let image_1 = req.files.image_1 && req.files.image_1[0];
        let image_2 = req.files.image_2 && req.files.image_2[0];
        let image_3 = req.files.image_3 && req.files.image_3[0];
        let image_4 = req.files.image_4 && req.files.image_4[0];

        return Product.findOne({ _id: { $nin: [params.id] }, brand_id: params.brand_id, name: params.name })
            .exec()
            .then((productExist) => {
                if (!productExist) {
                    return Product.findOne({ _id: params.id })
                        .exec()
                        .then((product: any) => {
                            let paths: any = {};
                            for (let i = 0; i < 5; i++) {
                                if (product[`image_${i}`] !== '') {
                                    paths[`image_${i}`] = product[`image_${i}`];
                                }
                            }
                            return axios.post(`${baseUrl}/api/product/delete`, { paths: paths })
                                .then(async (response: any) => {
                                    return Product.updateOne({ _id: params.id }, { image_0: '', image_1: '', image_2: '', image_3: '', image_4: '' })
                                })
                                .then(async () => {
                                    // Prepair to send and save product images.
                                    let formData = new FormData();
                                    formData.append('image_0', fs.createReadStream(image_0.path), { filename: `${params.name}-image_0-` + image_0.originalname });
                                    image_1 ? formData.append('image_1', fs.createReadStream(image_1.path), { filename: `${params.name}-image_1-` + image_1.originalname }) : null;
                                    image_2 ? formData.append('image_2', fs.createReadStream(image_2.path), { filename: `${params.name}-image_2-` + image_2.originalname }) : null;
                                    image_3 ? formData.append('image_3', fs.createReadStream(image_3.path), { filename: `${params.name}-image_3-` + image_3.originalname }) : null;
                                    image_4 ? formData.append('image_4', fs.createReadStream(image_4.path), { filename: `${params.name}-image_4-` + image_4.originalname }) : null;
                                    formData.append('brand_id', params.brand_id);
                                    formData.append('product_name', params.name);

                                    const config_headers = {
                                        headers: {
                                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                                        }
                                    }

                                    return axios.post(`${baseUrl}/api/product/save`, formData, config_headers)
                                        .then(async (response: any) => {
                                            params.image_0 = response.data.images.image_0;
                                            params.image_1 = response.data.images.image_1;
                                            params.image_2 = response.data.images.image_2;
                                            params.image_3 = response.data.images.image_3;
                                            params.image_4 = response.data.images.image_4;

                                            return Product.updateOne({ _id: params.id }, params)
                                                .then(() => {
                                                    return res.status(200).json({
                                                        success: true,
                                                        message: `Update product successful!`
                                                    })
                                                })
                                        })
                                })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Product name has been used!`
                    })
                }
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            }).finally(() => {
                fs.unlinkSync(image_0.path);
                fs.unlinkSync(image_1.path);
                fs.unlinkSync(image_2.path);
                fs.unlinkSync(image_3.path);
                fs.unlinkSync(image_4.path);
            });
    })
};

const deleteProduct = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    return Product.findOne({ _id: id })
        .exec()
        .then((product: any) => {
            let paths: any = {};
            for (let i = 0; i < 5; i++) {
                if (product[`image_${i}`] !== '') {
                    paths[`image_${i}`] = product[`image_${i}`];
                }
            }
            return axios.post(`${baseUrl}/api/product/delete`, { paths: paths })
                .then(async (response: any) => {
                    return Product.deleteOne({ _id: id })
                        .exec()
                        .then((response) => {
                            return res.status(200).json({
                                success: true,
                                message: `Delete product successful!`
                            });
                        })
                })
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        })
};

export {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
};
