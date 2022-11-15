import express from 'express';
const router = express.Router();

import { logIn, logOut, refreshToken } from '../controllers/admin/authUserController';
import { createUser, getUsers, changePassword, updateUser, deleteUser } from '../controllers/admin/userController';
import {
    getAllImagesKYC, confirmCustomerKYC
} from '../controllers/admin/customerKYCController';
import { getDuplicateBankAccount } from '../controllers/admin/bankAccountController';
import { createCompany, getCompanies, updateCompany, updateCompanyAvatar, deleteCompany } from '../controllers/admin/companyController';
import { createMerchant, getMerchants, updateMerchant, updateMerchantAvatar, updateMerchantBanner, deleteMerchant } from '../controllers/admin/merchantController';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/admin/categoryController';
import { createBrand, getBrands, updateBrand, updateBrandAvatar, deleteBrand } from '../controllers/admin/brandController';
import { createEvent, getEvents, updateEvent, deleteEvent, getEventsByApproved, approveEvent } from '../controllers/admin/eventController';
import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/admin/productController';
import { createLanguage, getLanguages, updateLanguage, deleteLanguage } from '../controllers/admin/languageController';

//----------------- Auth User Router -----------------//
router.post('/auth/login', logIn);
router.post('/auth/logout', logOut);
router.post('/auth/refresh_token', refreshToken);

//----------------- User Router -----------------//
router.post('/user/create_user', createUser);
router.get('/user/get_users', getUsers);
router.post('/user/change_password', changePassword);
router.post('/user/update_user', updateUser);
router.post('/user/delete_user', deleteUser);

//----------------- Customer KYC Router -----------------//
router.get('/customer_kyc/get_all_images_kyc', getAllImagesKYC);
router.post('/customer_kyc/confirm_customer_kyc', confirmCustomerKYC);

//----------------- Bank Account Router -----------------//
router.get('/bank_account/get_duplicate_bank_account', getDuplicateBankAccount);

//----------------- Company Router -----------------//
router.post('/company/create_company', createCompany);
router.get('/company/get_companies', getCompanies);
router.post('/company/update_company', updateCompany);
router.post('/company/update_company_avatar', updateCompanyAvatar);
router.post('/company/delete_company', deleteCompany);

//----------------- Merchant Router -----------------//
router.post('/merchant/create_merchant', createMerchant);
router.get('/merchant/get_merchants', getMerchants);
router.post('/merchant/update_merchant', updateMerchant);
router.post('/merchant/update_merchant_avatar', updateMerchantAvatar);
router.post('/merchant/update_merchant_banner', updateMerchantBanner);
router.post('/merchant/delete_merchant', deleteMerchant);

//----------------- Category Router -----------------//
router.post('/category/create_category', createCategory);
router.get('/category/get_categories', getCategories);
router.post('/category/update_category', updateCategory);
router.post('/category/delete_category', deleteCategory);

//----------------- Brand Router -----------------//
router.post('/brand/create_brand', createBrand);
router.get('/brand/get_brands', getBrands);
router.post('/brand/update_brand', updateBrand);
router.post('/brand/update_brand_avatar', updateBrandAvatar);
router.post('/brand/delete_brand', deleteBrand);

//----------------- Event Router -----------------//
router.post('/event/create_event', createEvent);
router.get('/event/get_events', getEvents);
router.post('/event/update_event', updateEvent);
router.post('/event/delete_event', deleteEvent);
router.get('/event/get_events_by_approved', getEventsByApproved);
router.post('/event/approve_event', approveEvent);

//----------------- Product Router -----------------//
router.post('/product/create_product', createProduct);
router.get('/product/get_products', getProducts);
router.post('/product/update_product', updateProduct);
router.post('/product/delete_product', deleteProduct);

//----------------- Language Router -----------------//
router.post('/language/create_language', createLanguage);
router.get('/language/get_languages', getLanguages);
router.post('/language/update_language', updateLanguage);
router.post('/language/delete_language', deleteLanguage);

export = router;