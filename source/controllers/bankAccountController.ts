import { NextFunction, Request, Response } from 'express';

import BankAccount from '../models/bankAccountModel';
import WarningBankAccount from '../models/warningBankAccountModel';
import Customer from '../models/customerModel';

const checkWarningBankAccount = (account_number: string, bank_name: string) => {
    return WarningBankAccount.findOne({ account_number: account_number, bank_name: bank_name })
        .exec()
        .then((existBankAccount) => {
            return existBankAccount
        })
}

const createBankAccount = async (req: Request, res: Response, next: NextFunction) => {
    let { customer_id, nickname, account_holder_name, account_number, bank_name, bank_branch } = req.body;
    return BankAccount.findOne({ customer_id: customer_id, account_number: account_number, bank_name: bank_name })
        .exec()
        .then(async (existData) => {
            if (!existData) {
                let warningBankAccount = await checkWarningBankAccount(account_number, bank_name);
                if (warningBankAccount) {
                    let params = {
                        customer_id,
                        nickname,
                        account_holder_name,
                        account_number,
                        bank_name,
                        bank_branch,
                        duplication: true,
                        duplicate_info: warningBankAccount._id
                    }

                    const bank_account = new BankAccount(params);
                    return bank_account.save((error, result) => {
                        if (error) {
                            console.log("Error: ", error)
                            return res.json({
                                error
                            })
                        }
                        res.status(200).json({
                            success: true,
                            message: `Successfully added bank account!`
                        });
                    })
                } else {
                    return BankAccount.findOne({ account_number: account_number, bank_name: bank_name })
                        .exec()
                        .then(async (bankAccountExist) => {
                            let params = {
                                customer_id,
                                nickname,
                                account_holder_name,
                                account_number,
                                bank_name,
                                bank_branch,
                                duplication: false,
                                duplicate_info: ''
                            }
                            if (bankAccountExist) {
                                let params_warning_bank_account = {
                                    account_holder_name,
                                    account_number,
                                    bank_name,
                                    bank_branch,
                                }
                                const warning_bank_account = new WarningBankAccount(params_warning_bank_account);
                                return warning_bank_account.save((error, result) => {
                                    if (error) {
                                        return res.json({
                                            error
                                        })
                                    }
                                    params.duplication = true;
                                    params.duplicate_info = result._id;
                                    return BankAccount.updateOne({ _id: bankAccountExist._id }, { duplication: true, duplicate_info: result._id })
                                        .then(() => {
                                            const bank_account = new BankAccount(params);
                                            return bank_account.save((error, result) => {
                                                if (error) {
                                                    console.log("Error: ", error)
                                                    return res.json({
                                                        error
                                                    })
                                                }
                                                res.status(200).json({
                                                    success: true,
                                                    message: `Successfully added bank account!`
                                                });
                                            })
                                        })
                                })
                            } else {
                                const bank_account = new BankAccount(params);
                                return bank_account.save((error, result) => {
                                    if (error) {
                                        console.log("Error: ", error)
                                        return res.json({
                                            error
                                        })
                                    }
                                    res.status(200).json({
                                        success: true,
                                        message: `Successfully added bank account!`
                                    });
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
            } else {
                return res.status(500).json({
                    success: false,
                    message: `You have added this bank account!`
                });
            }
        })
};

const getBankAccounts = (req: Request, res: Response, next: NextFunction) => {
    let { customer_id } = req.query;
    let query: any = {};

    customer_id ? query.customer_id = customer_id : null;

    return BankAccount.find(query)
        .exec()
        .then((bankAccountsExist) => {
            if (bankAccountsExist.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: `Get bank account info successful!`,
                    bank_account: bankAccountsExist
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: `This customer's bank account could not be found!`,
                    bank_account: []
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

const updateBankAccount = (req: Request, res: Response, next: NextFunction) => {
    let { id, customer_id, nickname, account_holder_name, account_number, bank_name, bank_branch } = req.body;

    return BankAccount.findOne({ _id: { $nin: [id] }, customer_id: customer_id, account_number: account_number, bank_name: bank_name })
        .exec()
        .then(async (existData) => {
            if (!existData) {
                let warningBankAccount = await checkWarningBankAccount(account_number, bank_name);
                console.log("warningBankAccount", warningBankAccount)
                if (warningBankAccount) {
                    let params_update = {
                        nickname,
                        account_holder_name,
                        account_number,
                        bank_name,
                        bank_branch,
                        duplication: true,
                        duplicate_info: warningBankAccount._id
                    }

                    return BankAccount.updateOne({ _id: id }, params_update)
                        .then(response => {
                            res.status(200).json({
                                success: true,
                                message: `Update bank account successful`
                            })
                        })
                        .catch((err: any) => {
                            return res.status(500).json({
                                message: err.message,
                                err
                            });
                        })
                } else {
                    return BankAccount.findOne({ _id: { $nin: [id] }, account_number: account_number, bank_name: bank_name })
                        .exec()
                        .then(async (bankAccountExist) => {
                            let params_update = {
                                nickname,
                                account_holder_name,
                                account_number,
                                bank_name,
                                bank_branch,
                                duplication: false,
                                duplicate_info: ''
                            }
                            if (bankAccountExist) {
                                let params_warning_bank_account = {
                                    account_holder_name,
                                    account_number,
                                    bank_name,
                                    bank_branch,
                                }
                                const warning_bank_account = new WarningBankAccount(params_warning_bank_account);
                                return warning_bank_account.save((error, result) => {
                                    if (error) {
                                        return res.json({
                                            error
                                        })
                                    }
                                    params_update.duplication = true;
                                    params_update.duplicate_info = result._id;
                                    return BankAccount.updateOne({ _id: bankAccountExist._id }, { duplication: true, duplicate_info: result._id })
                                        .then(() => {
                                            return BankAccount.updateOne({ _id: id }, params_update)
                                                .then(response => {
                                                    res.status(200).json({
                                                        success: true,
                                                        message: `Update bank account successful`
                                                    })
                                                })
                                                .catch((err: any) => {
                                                    return res.status(500).json({
                                                        message: err.message,
                                                        err
                                                    });
                                                })
                                        })
                                })
                            } else {
                                return BankAccount.updateOne({ _id: id }, params_update)
                                    .then(response => {
                                        res.status(200).json({
                                            success: true,
                                            message: `Update bank account successful`
                                        })
                                    })
                                    .catch((err: any) => {
                                        return res.status(500).json({
                                            message: err.message,
                                            err
                                        });
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
            } else {
                return res.status(500).json({
                    success: false,
                    message: `You have added this bank account!`
                });
            }
        })
};

const deleteBankAccount = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    try {
        BankAccount.deleteOne({ _id: id })
            .exec()
            .then((response) => {
                return res.status(200).json({
                    success: true,
                    message: `Delete bank account successful`
                });
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            err
        });
    }
};

const getDuplicateBankAccount = (req: Request, res: Response, next: NextFunction) => {
    let removed_fields_bank_account = { created_at: 0, updated_at: 0, duplication: 0 }
    let removed_fields_customer = { confirmed_email: 0, confirmed_phone_number: 0, refresh_token: 0, password: 0, updated_at: 0, created_at: 0 }

    try {
        BankAccount.find({ duplication: true }, removed_fields_bank_account).populate('customer_id', removed_fields_customer)
            .exec()
            .then(async (data) => {
                let result_data: any = {};
                const asyncHandleData = async () => {
                    return Promise.all(data.map(async (item: any) => {
                        // Create Object Data
                        result_data[item.duplicate_info] = result_data[item.duplicate_info] ? result_data[item.duplicate_info] : JSON.parse(JSON.stringify(item));
                        // Get customer duplicate & push someone new.
                        let array_customer_duplicate = result_data[item.duplicate_info]['customer_duplicate'] || [];
                        array_customer_duplicate.push(item.customer_id);
                        // assign a new value to customer_duplicate
                        result_data[item.duplicate_info]['customer_duplicate'] = array_customer_duplicate;
                        delete result_data[item.duplicate_info]['customer_id'];
                    }))
                }

                asyncHandleData().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: `Get duplicate bank account successful!`,
                        result_data: Object.values(result_data)
                    });
                })
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            err
        });
    }
};

export {
    createBankAccount,
    getBankAccounts,
    updateBankAccount,
    deleteBankAccount,
    getDuplicateBankAccount
};
