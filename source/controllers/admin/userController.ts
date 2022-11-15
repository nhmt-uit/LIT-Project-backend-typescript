import { NextFunction, Request, Response } from 'express';
const bcrypt = require('bcrypt');

import User from '../../models/userModel';

const salt = 10;

const createUser = (req: Request, res: Response, next: NextFunction) => {
    let params = req.body;

    User.findOne({ email: params.email })
        .exec()
        .then((customerExist) => {
            if (!customerExist) {
                bcrypt.hash(params.password, salt, (err: any, hash: any) => {
                    if (err) {
                        return next(err);
                    }
                    const user = new User(params);
                    user.password = hash;
                    return user.save((error, result) => {
                        if (error) {
                            return res.json({
                                error
                            })
                        }
                        return res.status(201).json({
                            success: true,
                            message: "Create user successful!",
                            customer: result
                        })
                    })
                })
            } else {
                res.status(401).json({
                    success: false,
                    message: `Email has been used!`
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

const getUsers = (req: Request, res: Response, next: NextFunction) => {
    let { user_id, name } = req.query;
    let query: any = {};
    name ? query.name = new RegExp(`^${name}$`, 'i') : null;
    user_id ? query._id = user_id : null;

    return User.find(query)
        .exec()
        .then(async (userExist) => {
            if (userExist.length > 0) {
                return res.status(201).json({
                    success: true,
                    message: "Get user successful!",
                    users: userExist
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any users!`
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

const changePassword = (req: Request, res: Response, next: NextFunction) => {
    let { user_id, password, new_password } = req.body;

    User.findOne({ _id: user_id })
        .exec()
        .then((userExist) => {
            if (userExist) {
                bcrypt.compare(password, userExist.password, (err: any, result: any) => {
                    if (result) {
                        bcrypt.hash(new_password, salt, (err: any, hash: any) => {
                            if (err) {
                                return next(err);
                            }
                            return User.updateOne({ _id: user_id }, { password: hash })
                                .then(response => {
                                    return res.status(200).json({
                                        success: true,
                                        message: 'Change password successful!'
                                    })
                                })
                        })
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: 'Enter wrong password!'
                        })
                    }
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'User not found!'
                })
            }
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
}

const updateUser = (req: Request, res: Response, next: NextFunction) => {
    let { user_id, name, email, role } = req.body;
    console.log(user_id, name, email, role)

    return User.findOne({ _id: { $nin: [user_id] }, email: email })
        .exec()
        .then(existUser => {
            if (!existUser) {
                return User.updateOne({ _id: user_id }, { name: name, email: email, role: role })
                    .then(response => {
                        return res.status(200).json({
                            success: true,
                            message: 'Update user successful!'
                        })
                    })
            } else {
                return res.status(400).json({
                    success: true,
                    message: 'Email user already in use!'
                })
            }
        })
        .catch(err => {
            return res.status(500).json({
                success: true,
                message: 'Update user fail!',
                err
            })
        })
};

const deleteUser = (req: Request, res: Response, next: NextFunction) => {
    let { user_id } = req.body;

    return User.deleteOne({ _id: user_id })
        .exec()
        .then((response) => {
            return res.status(200).json({
                success: true,
                message: `Delete user successful!`
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        })
};

export {
    createUser,
    getUsers,
    changePassword,
    updateUser,
    deleteUser
};
