import { NextFunction, Request, Response } from 'express';
const axios = require('axios');

import Company from '../models/companyModel';

const baseUrl = process.env.ARCHIVE_HOST;

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

export {
    getCompanies,
};
