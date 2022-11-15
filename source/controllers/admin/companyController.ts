import { NextFunction, Request, Response } from 'express';
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

import Company from '../../models/companyModel';

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

const createCompany = (req: any, res: Response, next: NextFunction) => {
    // Create Upload Folder
    if (!fs.existsSync(`uploads`)) {
        fs.mkdirSync(`uploads`)
    }
    try {
        upload(req, res, async function (err: any) {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Choose an image!'
                })
            }

            let { name } = req.body;
            return Company.findOne({ name: name })
                .exec()
                .then((companyExist) => {
                    if (!companyExist) {
                        // Prepair to send and save company image.
                        let formData = new FormData();
                        formData.append('image', fs.createReadStream(req.file.path), { filename: `${name}-` + req.file.originalname });
                        const config_headers = {
                            headers: {
                                "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                            }
                        }
                        axios.post(`${baseUrl}/api/company/save`, formData, config_headers)
                            .then(async (response: any) => {
                                let avatar = response.data.path
                                const company = new Company({ name: name, avatar: avatar });
                                return company.save((error, result) => {
                                    if (error) {
                                        return res.json({
                                            error
                                        })
                                    }
                                    return res.status(201).json({
                                        success: true,
                                        message: "Create company successful!",
                                        company: result
                                    })
                                })
                            })
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: `Company name has been used!`
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
                    fs.unlinkSync(req.file.path);
                });
        })
    } catch (err) {
        console.log("Error: ", err)
        return res.status(500).json({
            err
        });
    }
};

const getCompanies = (req: Request, res: Response, next: NextFunction) => {
    let { name } = req.query;
    let query: any = {};
    if (name) {
        query.name = new RegExp(`^${name}$`, 'i');
    }

    return Company.find(query)
        .exec()
        .then(async (companyExist) => {
            if (companyExist.length > 0) {
                const asyncGetCompanyAvatar = async () => {
                    return Promise.all(companyExist.map(async (company: any) => {
                        if (company.avatar !== '') {
                            await axios.post(`${baseUrl}/api/company/get`, { path: company.avatar })
                                .then(async (response: any) => {
                                    let data = response.data;
                                    company.avatar = data.image;
                                    return company;
                                })
                        }
                        return company;
                    }))
                }
                await asyncGetCompanyAvatar().then(() => {
                    return res.status(201).json({
                        success: true,
                        message: "Get company successful!",
                        companies: companyExist
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any companies!`
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

const updateCompany = (req: Request, res: Response, next: NextFunction) => {
    let { id, name } = req.body;

    return Company.findOne({ _id: { $nin: [id] }, name: name })
        .exec()
        .then(companyExist => {
            if (!companyExist) {
                return Company.updateOne({ _id: id }, { name: name })
                    .then(() => {
                        return res.status(200).json({
                            success: true,
                            message: "Update company successful!"
                        })
                    })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Company name has been used!`
                })
            }
        })
};

const updateCompanyAvatar = (req: any, res: Response, next: NextFunction) => {
    upload(req, res, async function (err: any) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let { id } = req.body;
        return Company.findOne({ _id: id })
            .exec()
            .then((companyExist: any) => {
                if (companyExist && companyExist.avatar !== '') {
                    axios.post(`${baseUrl}/api/company/delete`, { path: companyExist.avatar })
                        .then(async (response: any) => {
                            Company.updateOne({ _id: id }, { avatar: '' })
                        })
                }
                if (companyExist) {
                    let formData = new FormData();
                    formData.append('image', fs.createReadStream(req.file.path), { filename: `${companyExist.name}-` + req.file.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }
                    axios.post(`${baseUrl}/api/company/save`, formData, config_headers)
                        .then(async (response: any) => {
                            let avatar = response.data.path
                            return Company.updateOne({ _id: id }, { avatar: avatar })
                                .then(() => {
                                    return res.status(200).json({
                                        success: true,
                                        message: `Update company avatar successful!`
                                    })
                                })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Update company avatar fail!`
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
                fs.unlinkSync(req.file.path);
            });
    })
};

const deleteCompany = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;
    return Company.findOne({ _id: id })
        .exec()
        .then((companyExist: any) => {
            if (companyExist && companyExist.avatar !== '') {
                axios.post(`${baseUrl}/api/company/delete`, { path: companyExist.avatar })
                    .then(async (response: any) => {
                        return Company.deleteOne({ _id: id })
                            .exec()
                            .then((response) => {
                                return res.status(200).json({
                                    success: true,
                                    message: `Delete company successful!`
                                });
                            })
                    })
            }
            if (!companyExist) {
                return res.status(401).json({
                    success: false,
                    message: `Delete company avatar fail!`
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
    createCompany,
    getCompanies,
    updateCompany,
    updateCompanyAvatar,
    deleteCompany
};
