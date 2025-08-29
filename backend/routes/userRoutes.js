// @ts-nocheck
import express from "express";
import passport from "passport"
// import { issueTokenAndRedirect } from "../db/passport.js"
import { keys } from "../db/Key.js";

import {
	followUnFollowUser,
	getUserProfile,
	
	logoutUser,

	updateUser,
	getSuggestedUsers,
	freezeAccount,
	changePassword,
	forgotPassword,
	login,
	register,
	resendCode,
	resetPassword,
	verifyEmail,
	uploadFromUrl,
	uploadFromLocal,
	googleAuthSuccess,
	verifyResetCode,
	
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";

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
userRouter.post( "/change-password", protectRoute, changePassword );
userRouter.patch("/update/:id", protectRoute, updateUser);













export default userRouter;
