import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
const bcrypt = require('bcrypt');
const { v1: uuidv1 } = require('uuid');

import Customer from '../models/customerModel';
import CustomerToken from '../models/customerTokenModel';
import mailer from '../utils/sendMail';
import sendSMS from '../utils/sendSMS';

const salt = 10;

const passwordResetExpires = 900000;
const phoneNumberVerificationExpires = 120000;
const emailVerificationExpires = 120000;

const signUpCustomer = (req: Request, res: Response, next: NextFunction) => {
    let params = req.body;

    Customer.findOne({ $or: [{ email: params.email }, { phone_number: params.phone_number }] })
        .exec()
        .then((customerExist) => {
            if (!customerExist) {
                bcrypt.hash(params.password, salt, (err: any, hash: any) => {
                    if (err) {
                        return next(err);
                    }
                    const customer = new Customer(params);
                    customer.password = hash;
                    return customer.save((error, result) => {
                        if (error) {
                            return res.json({
                                error
                            })
                        }
                        const customer_token = new CustomerToken({ customer_id: result._id });
                        return customer_token.save(() => {
                            res.status(201).json({
                                success: true,
                                message: "Sign up successful!",
                                customer: result
                            })
                        })
                    })
                })
            } else {
                let typeExist = customerExist.email === params.email ? 'Email' : 'Phone number';
                res.status(401).json({
                    success: false,
                    message: `${typeExist} has been used!`
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

const logInCustomer = (req: Request, res: Response, next: NextFunction) => {
    let { email, password } = req.body;

    Customer.findOne({ email: email })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                bcrypt.compare(password, customerExist.password, (err: any, resultLogin: any) => {
                    if (resultLogin) {
                        res.status(200).json({
                            success: true,
                            message: 'Login successful!',
                            customer: customerExist
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
};

const changePassword = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, password, new_password } = req.body;

    Customer.findOne({ _id: customer_id })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                bcrypt.compare(password, customerExist.password, (err: any, result: any) => {
                    if (result) {
                        bcrypt.hash(new_password, salt, (err: any, hash: any) => {
                            if (err) {
                                return next(err);
                            }
                            return Customer.updateOne({ _id: customer_id }, { password: hash })
                                .then(response => {
                                    res.status(200).json({
                                        success: true,
                                        message: 'Change password successful!'
                                    })
                                })
                        })
                    } else {
                        res.status(400).json({
                            success: false,
                            message: 'Enter wrong password!'
                        })
                    }
                });
            } else {
                res.status(404).json({
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

const forgotPasswordCustomer = (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;

    Customer.findOne({ email: email })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                // const reset_password_token = uuidv1();
                // TẠM THỜI:
                const reset_password_token = Math.floor(Math.random() * 900000 + 100000).toString();
                CustomerToken.updateOne({ customer_id: customerExist._id }, { reset_password_token: reset_password_token, reset_password_token_expires: timeExpires(passwordResetExpires) })
                    .then((response) => {
                        // Send link reset password via mail
                        const subject = "Reset your Lit's account password - do not reply";
                        // const htmlContent = `
                        //     <h2 style="text-align: center"> LIT reset password </h2>
                        //     <p>Dear ${customerExist.last_name},</p>
                        //     <p>We heard that you lost your LIT password. Sorry about that!</p>
                        //     <p>But don’t worry! You can use the following below link to reset your password:</p>
                        //     <h3><a href="http://localhost:3000/reset_password/${reset_password_token}"> Reset password </a></h3>
                        //     <p>If you don’t use this link within 15 minutes, it will expire. <strong>Absolutely do not share this email to anyone.</strong></p>
                        //     <p>Thanks,</p>
                        //     <p>The LIT Team.</p>
                        // `

                        // TẠM THỜI:
                        const htmlContent = `
                            <h2 style="text-align: center"> LIT reset password </h2>
                            <p>Dear ${customerExist.last_name},</p>
                            <p>We heard that you lost your LIT password. Sorry about that!</p>
                            <p>But don’t worry! You can use below code to reset your password:</p>
                            <h3 style="color:blue; font-size: 20px">${reset_password_token}</h3>
                            <p>If you don’t use this code within 15 minutes, it will expire. <strong>Absolutely do not share this email to anyone.</strong></p>
                            <p>Thanks,</p>
                            <p>The LIT Team.</p>
                        `

                        return mailer.sendMail(email, subject, htmlContent).then(() => {
                            res.status(200).json({
                                success: true,
                                message: "Check mail to see reset password link!"
                            })
                        })
                    })
            } else {
                res.status(404).json({
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

const resetPasswordCustomer = (req: Request, res: Response, next: NextFunction) => {
    let { email, new_password, reset_password_token } = req.body;

    Customer.findOne({ email: email })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                CustomerToken.findOne({ customer_id: customerExist._id })
                    .exec()
                    .then((customerTokenInfo: any) => {
                        if (customerTokenInfo && customerTokenInfo.reset_password_token === reset_password_token && timeExpires(0) <= customerTokenInfo.reset_password_token_expires) {
                            bcrypt.hash(new_password, salt, (err: any, hash: any) => {
                                if (err) {
                                    return next(err);
                                }
                                return Customer.updateOne({ _id: customerExist._id }, { password: hash })
                                    .then(() => {
                                        return CustomerToken.updateOne({ _id: customerTokenInfo._id }, { reset_password_token: '' })
                                    })
                                    .then(() => {
                                        res.status(200).json({
                                            success: true,
                                            message: "Reset password successful!"
                                        })
                                    })
                            })
                        } else {
                            res.status(400).json({
                                success: false,
                                message: "Password reset link expired!"
                            })
                        }
                    })
            } else {
                res.status(404).json({
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

const requestVerifyEmail = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, email } = req.body;

    Customer.findOne({ _id: customer_id, email: email })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                // TẠM THỜI
                // const email_authentication_token = uuidv1();
                const email_authentication_token = Math.floor(Math.random() * 900000 + 100000).toString();
                CustomerToken.updateOne({ customer_id: customerExist._id }, { email_authentication_token: email_authentication_token, email_authentication_token_expires: timeExpires(emailVerificationExpires) })
                    .then((response) => {
                        // Send link email authentication via mail
                        const subject = "Verify your email - do not reply";
                        // const htmlContent = `
                        //     <h2 style="text-align: center"> LIT NOW </h2>
                        //     <p>Dear ${customerExist.last_name},</p>
                        //     <p>Please click the link below to verify your email:</p>
                        //     <h3><a href="http://localhost:3000/verify_email/${email_authentication_token}"> Verify </a></h3>
                        //     <p>If you don’t use this link within 2 minutes, it will expire! <strong>Absolutely do not share this email to anyone.</strong></p>
                        //     <p>Thanks,</p>
                        //     <p>The LIT Team.</p>
                        // `

                        const htmlContent = `
                            <h2 style="text-align: center"> LIT NOW </h2>
                            <p>Dear ${customerExist.last_name},</p>
                            <p>Please enter this code to verify your email:</p>
                            <h3 style="color:blue; font-size: 20px">${email_authentication_token}</h3>
                            <p>If you don’t use this link within 2 minutes, it will expire! <strong>Absolutely do not share this email to anyone.</strong></p>
                            <p>Thanks,</p>
                            <p>The LIT Team.</p>
                        `

                        return mailer.sendMail(email, subject, htmlContent).then(() => {
                            res.status(200).json({
                                success: true,
                                message: "Check mail to verify your email!"
                            })
                        })
                    })
            } else {
                res.status(404).json({
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

const verifyEmail = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, email, email_authentication_token } = req.body;

    Customer.findOne({ _id: customer_id, email: email })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                CustomerToken.findOne({ customer_id: customerExist._id })
                    .exec()
                    .then((customerTokenInfo: any) => {
                        if (customerTokenInfo && customerTokenInfo.email_authentication_token === email_authentication_token && timeExpires(0) <= customerTokenInfo.email_authentication_token_expires) {
                            return Customer.updateOne({ _id: customerExist._id }, { confirmed_email: true })
                                .then(() => {
                                    res.status(200).json({
                                        success: true,
                                        message: "Verify email successful!"
                                    })
                                })
                        } else {
                            res.status(400).json({
                                success: false,
                                message: "Email verification link expired!"
                            })
                        }
                    })
            } else {
                res.status(404).json({
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

const requestVerifyPhoneNumber = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, phone_number } = req.body;

    Customer.findOne({ _id: customer_id, phone_number: phone_number })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                const sms_authentication_code = Math.floor(Math.random() * 900000 + 100000);
                CustomerToken.updateOne({ customer_id: customerExist._id }, { sms_authentication_code: sms_authentication_code, sms_authentication_code_expires: timeExpires(phoneNumberVerificationExpires) })
                    .then((response) => {
                        res.status(200).json({
                            success: true,
                            message: "Check your SMS to verify your phone number!",
                            sms_authentication_code: sms_authentication_code
                        })
                        // return sendSMS.sendSMS(phone_number, sms_authentication_code)
                        //     .then(() => {
                        //         res.status(200).json({
                        //             success: true,
                        //             message: "Check your SMS to verify your phone number!",
                        //             sms_authentication_code: sms_authentication_code
                        //         })
                        //     })
                    })
            } else {
                res.status(404).json({
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

const verifyPhoneNumber = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, phone_number, sms_authentication_code } = req.body;

    Customer.findOne({ _id: customer_id, phone_number: phone_number })
        .exec()
        .then((customerExist) => {
            if (customerExist) {
                CustomerToken.findOne({ customer_id: customerExist._id })
                    .exec()
                    .then((customerTokenInfo: any) => {
                        if (customerTokenInfo && customerTokenInfo.sms_authentication_code === Number(sms_authentication_code) && timeExpires(0) <= customerTokenInfo.sms_authentication_code_expires) {
                            return Customer.updateOne({ _id: customerExist._id }, { confirmed_phone_number: true })
                                .then(() => {
                                    res.status(200).json({
                                        success: true,
                                        message: "Verify phone number successful!"
                                    })
                                })
                        } else if (customerTokenInfo.sms_authentication_code !== Number(sms_authentication_code)) {
                            res.status(400).json({
                                success: false,
                                message: "Wrong verification code!"
                            })
                        } else {
                            res.status(400).json({
                                success: false,
                                message: "Phone number verification code expired!"
                            })
                        }
                    })
            } else {
                res.status(404).json({
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

const timeExpires = (miliseconds: number) => {
    const now = Date.now();
    return Math.floor((now + miliseconds) / 1000);
}

export {
    signUpCustomer,
    logInCustomer,
    changePassword,
    forgotPasswordCustomer,
    resetPasswordCustomer,
    requestVerifyEmail,
    verifyEmail,
    requestVerifyPhoneNumber,
    verifyPhoneNumber
};
