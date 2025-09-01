// @ts-nocheck
import express from "express";
import passport from "passport"
// import { issueTokenAndRedirect } from "../db/passport.js"
import { keys } from "../db/Key.js";

import {
	
	getUserProfile,
	logoutUser,
	updateUser,
	changePassword,
	forgotPassword,
	login,
	register,
	resendCode,
	resetPassword,
	verifyEmail,
	verifyResetCode,
	uploadDocuments,
	acceptTerms
	
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

import multer from "multer";
import {uploadImages} from "../middlewares/upload.js";

function generateToken(user) {
	return jwt.sign({ id: user._id }, keys.jwtSecret, { expiresIn: "7d" });
  }



const userRouter = express.Router();

userRouter.get("/profile/:query",protectRoute, getUserProfile);
userRouter.post("/logout", protectRoute,logoutUser);
userRouter.post("/register", register);
userRouter.post("/verify", verifyEmail);
userRouter.post("/resend-code", resendCode);
userRouter.post("/verify-reset-code", verifyResetCode);
userRouter.post("/login", login);
userRouter.post( "/forgot-password", forgotPassword );
userRouter.post( "/reset-password", resetPassword );
userRouter.patch( "/change-password", protectRoute, changePassword );
userRouter.patch( "/update/:id", protectRoute, updateUser );

// Upload identity documents
userRouter.post(
  "/:userId/documents",
  protectRoute,
  uploadImages.fields([
    { name: "idCardFront", maxCount: 1 },
    { name: "driverLicense", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "bankStatement", maxCount: 1 },
  ]),
  uploadDocuments
);

// Accept terms
userRouter.post("/:userId/terms", protectRoute, acceptTerms);

// Admin approves
// userRouter.post("/:userId/approve", approveUser);


export default userRouter;
