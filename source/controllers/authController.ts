import { NextFunction, Request, Response } from 'express';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

import Customer from '../models/customerModel';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const logIn = (req: Request, res: Response, next: NextFunction) => {
    let { email, password } = req.body;

    // Update for user can login by email or phone number. Params email is login name.
    let phone_number = '';
    Customer.findOne({ $or: [{ email: new RegExp(`^${email}$`, 'i') }, { phone_number: phone_number }] })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                bcrypt.compare(password, customerExist.password, (err: any, resultLogin: any) => {
                    if (resultLogin) {
                        const data = { _id: customerExist._id }
                        const accessToken = generateAccessToken(data)
                        const refreshToken = jwt.sign(data, REFRESH_TOKEN_SECRET)
                        return Customer.updateOne({ _id: customerExist._id }, { refresh_token: refreshToken })
                            .then(response => {
                                res.status(200).json({
                                    success: true,
                                    message: 'Login successful!',
                                    accessToken: accessToken,
                                    refreshToken: refreshToken,
                                    customer: customerExist
                                })
                            })
                    } else {
                        res.status(400).json({
                            success: false,
                            message: 'Login unsuccessful!'
                        })
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'User email not found!'
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

const logOut = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id } = req.body;

    Customer.updateOne({ _id: customer_id }, { refresh_token: '' })
        .then(() => {
            res.status(200).json({
                success: true,
                message: 'Logout successful!',
            })
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

const refreshToken = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, refresh_token } = req.body;

    if (refresh_token == null) {
        return res.status(401).json({
            success: false,
            message: "Not have refresh token"
        });
    }

    Customer.findOne({ _id: customer_id })
        .exec()
        .then((customerExist: any) => {
            if (!customerExist.refresh_token || customerExist.refresh_token !== refresh_token) {
                return res.status(403).json({
                    success: false,
                    message: "Wrong refresh token!"
                });
            }

            jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err: any) => {
                if (err) return res.status(403)
                const accessToken = generateAccessToken({ _id: customerExist._id })
                res.status(200).json({
                    success: true,
                    message: 'Refresh token successful!',
                    accessToken: accessToken,
                })
            })
        })
}

const generateAccessToken = (user: any) => {
    return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
}

export {
    logIn,
    logOut,
    refreshToken
};
