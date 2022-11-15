import { NextFunction, Request, Response } from 'express';
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

import Merchant from '../../models/merchantModel';

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

const upload = multer({ storage: storage }).fields([{ name: 'avatar' }, { name: 'banner' }]);

const createMerchant = (req: any, res: Response, next: NextFunction) => {
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
        let avatar = req.files.avatar && req.files.avatar[0];
        let banner = req.files.banner && req.files.banner[0];

        return Merchant.findOne({ name: params.name })
            .exec()
            .then((merchantExist) => {
                if (!merchantExist) {
                    // Prepair to send and save merchant image.
                    let formData = new FormData();
                    formData.append('avatar', fs.createReadStream(avatar.path), { filename: `${params.name}-avatar-` + avatar.originalname });
                    formData.append('banner', fs.createReadStream(banner.path), { filename: `${params.name}-banner-` + banner.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/merchant/save`, formData, config_headers)
                        .then(async (response: any) => {
                            params.avatar = response.data.avatar;
                            params.banner = response.data.banner;
                            const merchant = new Merchant(params);
                            return merchant.save((error, result) => {
                                if (error) {
                                    return res.json({
                                        error
                                    })
                                }
                                return res.status(201).json({
                                    success: true,
                                    message: "Create merchant successful!",
                                    merchant: result
                                })
                            })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Merchant name has been used!`
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
                fs.unlinkSync(banner.path);
            });
    })
};

const getMerchants = (req: Request, res: Response, next: NextFunction) => {
    let { name } = req.query;
    let query: any = {};
    if (name) {
        query.name = new RegExp(`^${name}$`, 'i');
    }

    return Merchant.find(query, { website: 0, banner: 0 })
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

const updateMerchant = (req: Request, res: Response, next: NextFunction) => {
    let { id, name, address_1, address_2, address_3, district, city, email, website, company_id, type } = req.body;
    let params_update = {
        name, address_1, address_2, address_3, district, city, email, website, company_id, type
    };

    return Merchant.findOne({ _id: { $nin: [id] }, name: name })
        .exec()
        .then(merchantExist => {
            if (!merchantExist) {
                return Merchant.updateOne({ _id: id }, params_update)
                    .then(() => {
                        return res.status(200).json({
                            success: true,
                            message: "Update merchant successful!"
                        })
                    })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Merchant name has been used!`
                })
            }
        })
};

const updateMerchantAvatar = (req: any, res: Response, next: NextFunction) => {
    upload(req, res, async function (err: any) {
        if (!req.files) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let { id } = req.body;
        let avatar = req.files.avatar && req.files.avatar[0];
        return Merchant.findOne({ _id: id })
            .exec()
            .then((merchantExist: any) => {
                if (merchantExist && merchantExist.avatar !== '') {
                    axios.post(`${baseUrl}/api/merchant/delete`, { path: merchantExist.avatar })
                        .then(async (response: any) => {
                            Merchant.updateOne({ _id: id }, { avatar: '' })
                        })
                }
                if (merchantExist) {
                    let formData = new FormData();
                    formData.append('avatar', fs.createReadStream(avatar.path), { filename: `${merchantExist.name}-avatar-` + avatar.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/merchant/save`, formData, config_headers)
                        .then(async (response: any) => {
                            let avatar = response.data.avatar;
                            return Merchant.updateOne({ _id: id }, { avatar: avatar })
                                .then(() => {
                                    return res.status(200).json({
                                        success: true,
                                        message: `Update merchant avatar successful!`
                                    })
                                })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Update merchant avatar fail!`
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

const updateMerchantBanner = (req: any, res: Response, next: NextFunction) => {
    upload(req, res, async function (err: any) {
        if (!req.files) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let { id } = req.body;
        let banner = req.files.banner && req.files.banner[0];
        return Merchant.findOne({ _id: id })
            .exec()
            .then((merchantExist: any) => {
                if (merchantExist && merchantExist.banner !== '') {
                    axios.post(`${baseUrl}/api/merchant/delete`, { path: merchantExist.banner })
                        .then(async (response: any) => {
                            Merchant.updateOne({ _id: id }, { banner: '' })
                        })
                }
                if (merchantExist) {
                    let formData = new FormData();
                    formData.append('banner', fs.createReadStream(banner.path), { filename: `${merchantExist.name}-banner-` + banner.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/merchant/save`, formData, config_headers)
                        .then(async (response: any) => {
                            let banner = response.data.banner;
                            return Merchant.updateOne({ _id: id }, { banner: banner })
                                .then(() => {
                                    return res.status(200).json({
                                        success: true,
                                        message: `Update merchant banner successful!`
                                    })
                                })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Update merchant banner fail!`
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
                fs.unlinkSync(banner.path);
            });
    })
};

const deleteMerchant = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    return Merchant.findOne({ _id: id })
        .exec()
        .then((merchantExist: any) => {
            if (merchantExist) {
                let path = {
                    avatar: merchantExist.avatar,
                    banner: merchantExist.banner
                }
                axios.post(`${baseUrl}/api/merchant/delete`, { path: path })
                    .then(async (response: any) => {
                        return Merchant.deleteOne({ _id: id })
                            .exec()
                            .then((response) => {
                                return res.status(200).json({
                                    success: true,
                                    message: `Delete merchant successful!`
                                });
                            })
                    })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Delete merchant avatar fail!`
                })
            }
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        })
};

export {
    createMerchant,
    getMerchants,
    updateMerchant,
    updateMerchantAvatar,
    updateMerchantBanner,
    deleteMerchant
};
