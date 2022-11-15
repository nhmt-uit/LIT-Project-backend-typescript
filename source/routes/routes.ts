import express from 'express';
const router = express.Router();

import { authenticateToken } from '../utils/authenticate';

import { logIn, logOut, refreshToken } from '../controllers/authController';
import {
    signUpCustomer, logInCustomer, changePassword, forgotPasswordCustomer, resetPasswordCustomer,
    requestVerifyEmail, verifyEmail, requestVerifyPhoneNumber, verifyPhoneNumber
} from '../controllers/customerController';
import {
    uploadPortrait, getPortrait, deletePortrait,
    uploadFrontSideIdCard, getFrontSideIdCard, deleteFrontSideIdCard,
    uploadBackSideIdCard, getBackSideIdCard, deleteBackSideIdCard,
    getAllImagesKYC, confirmCustomerKYC
} from '../controllers/customerKYCController';
import { createBankAccount, getBankAccounts, updateBankAccount, deleteBankAccount, getDuplicateBankAccount } from '../controllers/bankAccountController';
import { getCompanies } from '../controllers/companyController';
import { getMerchants, getMerchantsSlider } from '../controllers/merchantController';
import { getBrands } from '../controllers/brandController';
import { getEvents } from '../controllers/eventController';
import { getProducts } from '../controllers/productController';
import { getLanguages } from '../controllers/languageController';

//----------------- Auth Router -----------------//
router.post('/auth/login', logIn);
router.post('/auth/logout', logOut);
router.post('/auth/refresh_token', refreshToken);

//----------------- Customer Router -----------------//
router.post('/customer/signup', signUpCustomer);
router.post('/customer/change_password', changePassword);
router.post('/customer/forgot_password', forgotPasswordCustomer);
router.post('/customer/reset_password', resetPasswordCustomer);
router.post('/customer/request_verify_email', requestVerifyEmail);
router.post('/customer/verify_email', verifyEmail);
router.post('/customer/request_verify_phone_number', requestVerifyPhoneNumber);
router.post('/customer/verify_phone_number', verifyPhoneNumber);

//----------------- Customer KYC Router -----------------//
router.post('/customer_kyc/upload_portrait', authenticateToken, uploadPortrait);
router.get('/customer_kyc/get_portrait', authenticateToken, getPortrait);
router.post('/customer_kyc/delete_portrait', authenticateToken, deletePortrait);

router.post('/customer_kyc/upload_front_side_id_card', authenticateToken, uploadFrontSideIdCard);
router.get('/customer_kyc/get_front_side_id_card', authenticateToken, getFrontSideIdCard);
router.post('/customer_kyc/delete_front_side_id_card', authenticateToken, deleteFrontSideIdCard);

router.post('/customer_kyc/upload_back_side_id_card', authenticateToken, uploadBackSideIdCard);
router.get('/customer_kyc/get_back_side_id_card', authenticateToken, getBackSideIdCard);
router.post('/customer_kyc/delete_back_side_id_card', authenticateToken, deleteBackSideIdCard);

router.get('/customer_kyc/get_all_images_kyc', authenticateToken, getAllImagesKYC);
router.post('/customer_kyc/confirm_customer_kyc', authenticateToken, confirmCustomerKYC);

//----------------- Bank Account Router -----------------//
router.post('/bank_account/create_bank_account', createBankAccount);
router.get('/bank_account/get_bank_accounts', getBankAccounts);
router.post('/bank_account/update_bank_account', updateBankAccount);
router.post('/bank_account/delete_bank_account', deleteBankAccount);
router.post('/bank_account/get_duplicate_bank_account', getDuplicateBankAccount);

//----------------- Company Router -----------------//
router.get('/company/get_companies', getCompanies);

//----------------- Merchant Router -----------------//
router.get('/merchant/get_merchants', getMerchants);
router.get('/merchant/get_merchants_slider', getMerchantsSlider);

//----------------- Brand Router -----------------//
router.get('/brand/get_brands', getBrands);

//----------------- Event Router -----------------//
router.get('/event/get_events', getEvents);

//----------------- Product Router -----------------//
router.get('/product/get_products', getProducts);

//----------------- Language Router -----------------//
router.get('/language/get_languages', getLanguages);

export = router;
