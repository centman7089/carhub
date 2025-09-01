// @ts-nocheck
import express from "express";
import { changePassword, createAdmin, forgotPassword, getAdminUser, getUserProfile, login, logoutUser, resendCode, resetPassword, updateUser, verifyCac, verifyEmail, verifyResetCode, rejectCac, approveUser } from "../controllers/adminControllers.js";
import { authorizeRoles, protectAdmin } from "../middlewares/adminAuth.js";


const adminRouter = express.Router()

adminRouter.post('/login', login)
adminRouter.post('/create', createAdmin)
adminRouter.post('/logout', logoutUser)
adminRouter.post('/resend-code', resendCode)
adminRouter.patch('/change-password',protectAdmin, changePassword)
adminRouter.post('/verify-email', verifyEmail)
adminRouter.post('/forgot-password', forgotPassword)
adminRouter.post( '/verify-reset-code', verifyResetCode )
adminRouter.post( '/reset-password', resetPassword )

adminRouter.get( '/get', protectAdmin,getUserProfile )
adminRouter.get( '/admin-user', protectAdmin,getAdminUser )

adminRouter.patch( "/update/:id", protectAdmin,updateUser );

adminRouter.patch('/verify-cac/:employerId',protectAdmin, authorizeRoles('superadmin'),verifyCac );
// adminRouter.put('/verify-cac/:employerId',protectAdmin, authorizeRoles('admin','superadmin'),verifyCac );
// Reject CAC
adminRouter.patch("/reject-cac/:employerId",protectAdmin, authorizeRoles('superadmin'), rejectCac);
adminRouter.patch("/:userId/approve",protectAdmin, authorizeRoles('admin'), approveUser);



export default adminRouter