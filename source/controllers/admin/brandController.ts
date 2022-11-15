import { NextFunction, Request, Response } from 'express';
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

import Brand from '../../models/brandModel';

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

const upload = multer({ storage: storage }).single('avatar');

const createBrand = (req: any, res: Response, next: NextFunction) => {
    // Create Upload Folder
    if (!fs.existsSync(`uploads`)) {
        fs.mkdirSync(`uploads`)
    }
    upload(req, res, async function (err: any) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let params = req.body;
        let avatar = req.file;

        return Brand.findOne({ name: params.name })
            .exec()
            .then((brandExist) => {
                if (!brandExist) {
                    // Prepair to send and save brand image.
                    let formData = new FormData();
                    formData.append('avatar', fs.createReadStream(avatar.path), { filename: `${params.name}-avatar-` + avatar.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/brand/save`, formData, config_headers)
                        .then(async (response: any) => {
                            params.avatar = response.data.avatar;
                            const brand = new Brand(params);
                            return brand.save((error, result) => {
                                if (error) {
                                    return res.json({
                                        error
                                    })
                                }
                                return res.status(201).json({
                                    success: true,
                                    message: "Create brand successful!",
                                    merchant: result
                                })
                            })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Brand name has been used!`
                    })
                }
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            }).finally(() => {
                fs.unlinkSync(avatar.path);
            });
    })
};

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

const updateBrand = (req: Request, res: Response, next: NextFunction) => {
    let { id, name } = req.body;
    let params_update = {
        name
    };

    return Brand.findOne({ _id: { $nin: [id] }, name: name })
        .exec()
        .then(brandExist => {
            if (!brandExist) {
                return Brand.updateOne({ _id: id }, params_update)
                    .then(() => {
                        return res.status(200).json({
                            success: true,
                            message: "Update brand successful!"
                        })
                    })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Brand name has been used!`
                })
            }
        })
};

const updateBrandAvatar = (req: any, res: Response, next: NextFunction) => {
    upload(req, res, async function (err: any) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let { id } = req.body;
        let avatar = req.file;
        return Brand.findOne({ _id: id })
            .exec()
            .then((brandExist: any) => {
                if (brandExist && brandExist.avatar !== '') {
                    axios.post(`${baseUrl}/api/brand/delete`, { path: brandExist.avatar })
                        .then(async (response: any) => {
                            Brand.updateOne({ _id: id }, { avatar: '' })
                        })
                }
                if (brandExist) {
                    let formData = new FormData();
                    formData.append('avatar', fs.createReadStream(avatar.path), { filename: `${brandExist.name}-avatar-` + avatar.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/brand/save`, formData, config_headers)
                        .then(async (response: any) => {
                            let avatar = response.data.avatar;
                            return Brand.updateOne({ _id: id }, { avatar: avatar })
                                .then(() => {
                                    return res.status(200).json({
                                        success: true,
                                        message: `Update brand avatar successful!`
                                    })
                                })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Update brand avatar fail!`
                    })
                }
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            })
            .finally(() => {
                fs.unlinkSync(avatar.path);
            });
    })
};

const deleteBrand = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    return Brand.findOne({ _id: id })
        .exec()
        .then((brandExist: any) => {
            if (brandExist && brandExist.avatar !== '') {
                axios.post(`${baseUrl}/api/brand/delete`, { path: brandExist.avatar })
                    .then(async (response: any) => {
                        return Brand.deleteOne({ _id: id })
                            .exec()
                            .then((response) => {
                                return res.status(200).json({
                                    success: true,
                                    message: `Delete brand successful!`
                                });
                            })
                    })
            }
            if (!brandExist) {
                return res.status(401).json({
                    success: false,
                    message: `Not found brand to delete!`
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
    createBrand,
    getBrands,
    updateBrand,
    updateBrandAvatar,
    deleteBrand
};
