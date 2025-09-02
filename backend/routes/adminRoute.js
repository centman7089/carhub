// @ts-nocheck
import express from "express";
import { changePassword, createAdmin, forgotPassword, getAdminUser, getUserProfile, login, logoutUser, resendCode, resetPassword, updateUser, verifyEmail, verifyResetCode, approveUser, rejectUser, createVehicle } from "../controllers/adminControllers.js";
import { authorizeRoles, protectAdmin } from "../middlewares/adminAuth.js";
import { vehicleImages } from "../middlewares/upload.js";


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


// adminRouter.put('/verify-cac/:employerId',protectAdmin, authorizeRoles('admin','superadmin'),verifyCac );
// Reject CAC

adminRouter.patch("/:userId/approve",protectAdmin, authorizeRoles('admin'), approveUser);
adminRouter.patch( "/:userId/reject", protectAdmin, authorizeRoles( 'admin' ), rejectUser );
// Admin-only routes
adminRouter.get("/users",protectAdmin, authorizeRoles('admin'),getAllUsers);
adminRouter.put( "/users/:userId/role", protectAdmin, authorizeRoles( 'admin' ), updateUserRole );
adminRouter.post(
  "/create-vehicle",
  protectAdmin, // require authentication (dealer must be logged in)
  vehicleImages.single("image"), // accept only one image with field name = "image"
  createVehicle
);



export default adminRouter