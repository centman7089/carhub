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
	acceptTerms,
	getUserById,
	getMyProfile,
	updateProfilePhoto
	
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

import multer from "multer";
import {uploadDocument,uploadProfilePhoto} from "../middlewares/upload.js";

function generateToken(user) {
	return jwt.sign({ id: user._id }, keys.jwtSecret, { expiresIn: "7d" });
  }



const userRouter = express.Router();

userRouter.get("/profile/:query",protectRoute, getUserProfile);
userRouter.post("/logout", protectRoute,logoutUser);
userRouter.post("/register", register);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resend-code", resendCode);
userRouter.post("/verify-reset-code", verifyResetCode);
userRouter.post("/login", login);
userRouter.post( "/forgot-password", forgotPassword );
userRouter.post( "/reset-password", resetPassword );
userRouter.post( "/change-password", protectRoute, changePassword );
userRouter.get("/me", protectRoute, getMyProfile )

// Upload identity documents
userRouter.post(
  "/:userId/documents",
  protectRoute,
  uploadDocument.fields([
    { name: "idCardFront", maxCount: 1 }
  ]),
  uploadDocuments
);
userRouter.put( "/update/:id", protectRoute, updateUser );
userRouter.get("/:userId", protectRoute, getUserById)
userRouter.patch(
  "/:userId/profile-photo",
  uploadProfilePhoto.single("profilePic"), // input name: profilePic
  updateProfilePhoto
);

// Accept terms
userRouter.post("/:userId/terms", protectRoute, acceptTerms);

// Admin approves
// userRouter.post("/:userId/approve", approveUser);


export default userRouter;
