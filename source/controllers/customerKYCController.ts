import { NextFunction, Request, Response } from 'express';
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

import CustomerKYC from '../models/customerKYCModel';

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

const upload = multer({ storage: storage }).single('image');

const uploadPortrait = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;
    // Create Upload Folder
    if (!fs.existsSync(`uploads`)) {
        fs.mkdirSync(`uploads`)
    }

    try {
        CustomerKYC.findOne({ customer_id: user._id })
            .exec()
            .then(CustomerKYCExist => {
                if (CustomerKYCExist && CustomerKYCExist.portrait_image_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/delete_image`, { path: CustomerKYCExist.portrait_image_path }, config_headers)
                        .then(async (response: any) => {
                            CustomerKYC.updateOne({ customer_id: user._id }, { portrait_image_path: '', status: false })
                        })
                }
            })

        upload(req, res, async function (err: any) {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Choose an image!'
                })
            }
            let formData = new FormData();
            formData.append('image', fs.createReadStream(req.file.path), { filename: 'portrait-' + req.file.originalname });
            const config_headers = {
                headers: {
                    "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                    "Authorization": req.headers['authorization']
                }
            }
            axios.post(`${baseUrl}/api/customer_kyc/save_image`, formData, config_headers)
                .then(async (response: any) => {
                    return [await CustomerKYC.findOne({ customer_id: user._id }), response.data]
                })
                .then((value: any) => {
                    let customerKYCExist = value[0];
                    let data = value[1];
                    if (customerKYCExist) {
                        return CustomerKYC.updateOne({ _id: customerKYCExist._id }, { portrait_image_path: data.path })
                            .then(() => {
                                return res.status(200).json({
                                    success: true,
                                    message: 'Upload image successful!'
                                })
                            })
                    } else {
                        const customer_kyc = new CustomerKYC({ customer_id: user._id, portrait_image_path: data.path });
                        return customer_kyc.save((error, result) => {
                            if (error) {
                                return res.json({
                                    error
                                })
                            }
                            return res.status(200).json({
                                success: true,
                                message: 'Upload image successful!'
                            })
                        })
                    }
                })
                .then(() => {
                    // Delete the file after we're done using it
                    fs.unlinkSync(`uploads/${req.file.filename}`);
                })
                .catch((err: any) => {
                    console.log("Error : ", err)
                })
        })
    } catch (err) {
        console.log("What happen:: ", err)
    }
};

const getPortrait = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    CustomerKYC.findOne({ customer_id: user._id })
        .exec()
        .then(CustomerKYCExist => {
            if (CustomerKYCExist) {
                let portrait_image_path = CustomerKYCExist.portrait_image_path;
                if (portrait_image_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/get_image`, { path: portrait_image_path }, config_headers)
                        .then(async (response: any) => {
                            let data = response.data;
                            return res.status(200).json({
                                success: true,
                                message: `Get portrait successful!`,
                                image: data.image,
                            })
                            // res.setHeader('Content-Type', 'image/jpeg');
                            // res.end(Buffer.from(data.image, 'base64')); // Convert base64 to buffer
                        })
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not found image`
                    })
                }

            } else {
                return res.status(404).json({
                    success: false,
                    message: `Not found customer's portrait`
                })
            }
        })
};

const deletePortrait = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    CustomerKYC.findOne({ customer_id: user._id })
        .exec()
        .then(CustomerKYCExist => {
            if (CustomerKYCExist) {
                let portrait_image_path = CustomerKYCExist.portrait_image_path;
                if (portrait_image_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/delete_image`, { path: portrait_image_path }, config_headers)
                        .then(async (response: any) => {
                            CustomerKYC.updateOne({ customer_id: user._id }, { portrait_image_path: '', status: false })
                                .then(() => {
                                    let data = response.data;
                                    if (data.success) {
                                        return res.status(400).json({
                                            success: true,
                                            message: `Delete image successful!`
                                        })
                                    } else {
                                        return res.status(400).json({
                                            success: false,
                                            message: `Fail to delete image`
                                        })
                                    }
                                })
                        })
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not found image!`
                    })
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: `Not found customer's portrait`
                })
            }
        })
};

const uploadFrontSideIdCard = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    try {
        CustomerKYC.findOne({ customer_id: user._id })
            .exec()
            .then(CustomerKYCExist => {
                if (CustomerKYCExist && CustomerKYCExist.front_side_of_id_card_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/delete_image`, { path: CustomerKYCExist.front_side_of_id_card_path }, config_headers)
                        .then(async (response: any) => {
                            CustomerKYC.updateOne({ customer_id: user._id }, { front_side_of_id_card_path: '', status: false })
                        })
                }
            })

        upload(req, res, async function (err: any) {
            let formData = new FormData();
            formData.append('image', fs.createReadStream(req.file.path), { filename: 'front-' + req.file.originalname });
            const config_headers = {
                headers: {
                    "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                    "Authorization": req.headers['authorization']
                }
            }
            axios.post(`${baseUrl}/api/customer_kyc/save_image`, formData, config_headers)
                .then(async (response: any) => {
                    return [await CustomerKYC.findOne({ customer_id: user._id }), response.data]
                })
                .then((value: any) => {
                    let customerKYCExist = value[0];
                    let data = value[1];
                    if (customerKYCExist) {
                        return CustomerKYC.updateOne({ _id: customerKYCExist._id }, { front_side_of_id_card_path: data.path })
                            .then(() => {
                                return res.status(200).json({
                                    success: true,
                                    message: 'Upload image successful!'
                                })
                            })
                    } else {
                        const customer_kyc = new CustomerKYC({ customer_id: user._id, front_side_of_id_card_path: data.path });
                        return customer_kyc.save((error, result) => {
                            if (error) {
                                return res.json({
                                    error
                                })
                            }
                            return res.status(200).json({
                                success: true,
                                message: 'Upload image successful!'
                            })
                        })
                    }
                })
                .then(() => {
                    // Delete the file after we're done using it
                    fs.unlinkSync(`uploads/${req.file.filename}`);
                })
                .catch((err: any) => {
                    console.log("Error : ", err)
                })
        })
    } catch (err) {
        console.log("What happen:: ", err)
    }
};

const getFrontSideIdCard = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    CustomerKYC.findOne({ customer_id: user._id })
        .exec()
        .then(CustomerKYCExist => {
            if (CustomerKYCExist) {
                let front_side_of_id_card_path = CustomerKYCExist.front_side_of_id_card_path;
                if (front_side_of_id_card_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/get_image`, { path: front_side_of_id_card_path }, config_headers)
                        .then(async (response: any) => {
                            let data = response.data;
                            return res.status(200).json({
                                success: true,
                                message: `Get front side of ID card successful!`,
                                image: data.image,
                            })
                        })
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not found image`
                    })
                }

            } else {
                return res.status(404).json({
                    success: false,
                    message: `Not found customer's portrait`
                })
            }
        })
};

const deleteFrontSideIdCard = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    CustomerKYC.findOne({ customer_id: user._id })
        .exec()
        .then(CustomerKYCExist => {
            if (CustomerKYCExist) {
                let front_side_of_id_card_path = CustomerKYCExist.front_side_of_id_card_path;
                if (front_side_of_id_card_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/delete_image`, { path: front_side_of_id_card_path }, config_headers)
                        .then(async (response: any) => {
                            CustomerKYC.updateOne({ customer_id: user._id }, { front_side_of_id_card_path: '', status: false })
                                .then(() => {
                                    let data = response.data;
                                    if (data.success) {
                                        return res.status(400).json({
                                            success: true,
                                            message: `Delete image successful!`
                                        })
                                    } else {
                                        return res.status(400).json({
                                            success: false,
                                            message: `Fail to delete image`
                                        })
                                    }
                                })
                        })
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not found image!`
                    })
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: `Not found customer's portrait`
                })
            }
        })
};

const uploadBackSideIdCard = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    try {
        CustomerKYC.findOne({ customer_id: user._id })
            .exec()
            .then(CustomerKYCExist => {
                if (CustomerKYCExist && CustomerKYCExist.back_side_of_id_card_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/delete_image`, { path: CustomerKYCExist.back_side_of_id_card_path }, config_headers)
                        .then(async (response: any) => {
                            CustomerKYC.updateOne({ customer_id: user._id }, { back_side_of_id_card_path: '', status: false })
                        })
                }
            })

        upload(req, res, async function (err: any) {
            let formData = new FormData();
            formData.append('image', fs.createReadStream(req.file.path), { filename: 'back-' + req.file.originalname });
            const config_headers = {
                headers: {
                    "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                    "Authorization": req.headers['authorization']
                }
            }
            axios.post(`${baseUrl}/api/customer_kyc/save_image`, formData, config_headers)
                .then(async (response: any) => {
                    return [await CustomerKYC.findOne({ customer_id: user._id }), response.data]
                })
                .then((value: any) => {
                    let customerKYCExist = value[0];
                    let data = value[1];
                    if (customerKYCExist) {
                        return CustomerKYC.updateOne({ _id: customerKYCExist._id }, { back_side_of_id_card_path: data.path })
                            .then(() => {
                                return res.status(200).json({
                                    success: true,
                                    message: 'Upload image successful!'
                                })
                            })
                    } else {
                        const customer_kyc = new CustomerKYC({ customer_id: user._id, back_side_of_id_card_path: data.path });
                        return customer_kyc.save((error, result) => {
                            if (error) {
                                return res.json({
                                    error
                                })
                            }
                            return res.status(200).json({
                                success: true,
                                message: 'Upload image successful!'
                            })
                        })
                    }
                })
                .then(() => {
                    // Delete the file after we're done using it
                    fs.unlinkSync(`uploads/${req.file.filename}`);
                })
                .catch((err: any) => {
                    console.log("Error : ", err)
                })
        })
    } catch (err) {
        console.log("What happen:: ", err)
    }
};

const getBackSideIdCard = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    CustomerKYC.findOne({ customer_id: user._id })
        .exec()
        .then(CustomerKYCExist => {
            if (CustomerKYCExist) {
                let back_side_of_id_card_path = CustomerKYCExist.back_side_of_id_card_path;
                if (back_side_of_id_card_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/get_image`, { path: back_side_of_id_card_path }, config_headers)
                        .then(async (response: any) => {
                            let data = response.data;
                            return res.status(200).json({
                                success: true,
                                message: `Get back side of ID card successful!`,
                                image: data.image,
                            })
                        })
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not found image`
                    })
                }

            } else {
                return res.status(404).json({
                    success: false,
                    message: `Not found customer's portrait`
                })
            }
        })
};

const deleteBackSideIdCard = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    CustomerKYC.findOne({ customer_id: user._id })
        .exec()
        .then(CustomerKYCExist => {
            if (CustomerKYCExist) {
                let back_side_of_id_card_path = CustomerKYCExist.back_side_of_id_card_path;
                if (back_side_of_id_card_path !== '') {
                    const config_headers = {
                        headers: {
                            "Authorization": req.headers['authorization']
                        }
                    }
                    axios.post(`${baseUrl}/api/customer_kyc/delete_image`, { path: back_side_of_id_card_path }, config_headers)
                        .then(async (response: any) => {
                            CustomerKYC.updateOne({ customer_id: user._id }, { back_side_of_id_card_path: '', status: false })
                                .then(() => {
                                    let data = response.data;
                                    if (data.success) {
                                        return res.status(400).json({
                                            success: true,
                                            message: `Delete image successful!`
                                        })
                                    } else {
                                        return res.status(400).json({
                                            success: false,
                                            message: `Fail to delete image`
                                        })
                                    }
                                })
                        })
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not found image!`
                    })
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: `Not found customer's portrait`
                })
            }
        })
};

const getAllImagesKYC = async (req: any, res: Response, next: NextFunction) => {
    let user = req.user;

    const config_headers = {
        headers: {
            "Authorization": req.headers['authorization']
        }
    }
    try {
        axios.post(`${baseUrl}/api/customer_kyc/get_all_image`, { path: `uploads/${user._id}` }, config_headers)
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
    let user = req.user;
    let { status } = req.body;

    try {
        return CustomerKYC.updateOne({ customer_id: user._id }, { status: status })
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
    uploadPortrait,
    getPortrait,
    deletePortrait,
    uploadFrontSideIdCard,
    getFrontSideIdCard,
    deleteFrontSideIdCard,
    uploadBackSideIdCard,
    getBackSideIdCard,
    deleteBackSideIdCard,
    getAllImagesKYC,
    confirmCustomerKYC
};
