// @ts-nocheck
import express from "express";
import { changePassword, createAdmin, forgotPassword, getAdminUser, getUserProfile, login, logoutUser, resendCode, resetPassword, updateUser, verifyEmail, verifyResetCode } from "../controllers/adminController.js";


const adminRoute = express.Router()

adminRoute.post('/login', login)
adminRoute.post('/create', createAdmin)
adminRoute.post('/logout', logoutUser)
adminRoute.post('/resend-code', resendCode)
adminRoute.post('/change-password', changePassword)
adminRoute.post('/verify-email', verifyEmail)
adminRoute.post('/forgot-password', forgotPassword)
adminRoute.post( '/verify-reset-code', verifyResetCode )
adminRoute.post( '/reset-password', resetPassword )

adminRoute.get( '/get', getUserProfile )
adminRoute.get( '/admin-user', getAdminUser )

adminRoute.patch("/update/:id",  updateUser);



export default adminRoute