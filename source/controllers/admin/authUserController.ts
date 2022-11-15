import { NextFunction, Request, Response } from 'express';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

import User from '../../models/userModel';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const logIn = (req: Request, res: Response, next: NextFunction) => {
    let { email, password } = req.body;

    User.findOne({ email: new RegExp(`^${email}$`, 'i') })
        .exec()
        .then((userExist) => {
            if (userExist) {
                bcrypt.compare(password, userExist.password, (err: any, resultLogin: any) => {
                    if (resultLogin) {
                        const data = { _id: userExist._id }
                        const accessToken = generateAccessToken(data)
                        const refreshToken = jwt.sign(data, REFRESH_TOKEN_SECRET)
                        return User.updateOne({ _id: userExist._id }, { refresh_token: refreshToken })
                            .then(response => {
                                res.status(200).json({
                                    success: true,
                                    message: 'Login successful!',
                                    accessToken: accessToken,
                                    refreshToken: refreshToken,
                                    user: userExist
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
    let { user_id } = req.body;

    User.updateOne({ _id: user_id }, { refresh_token: '' })
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
    let { user_id, refresh_token } = req.body;

    if (refresh_token == null) {
        return res.status(401).json({
            success: false,
            message: "Not have refresh token"
        });
    }

    return User.findOne({ _id: user_id })
        .exec()
        .then((userExist: any) => {
            console.log("userExist", userExist)
            if (!userExist.refresh_token || userExist.refresh_token !== refresh_token) {
                return res.status(403).json({
                    success: false,
                    message: "Wrong refresh token!"
                });
            }

            jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err: any) => {
                if (err) return res.status(403)
                const accessToken = generateAccessToken({ _id: userExist._id })
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
