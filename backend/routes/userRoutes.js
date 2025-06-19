import express from "express";
import passport from "passport"
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
	
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";
import auth from "../middlewares/authMiddleware.js";
import { resumeUpload, photoUpload } from "../middlewares/upload.js";
// Set up multer for local upload
const upload = multer({ dest: "temp_uploads/" });

const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);

router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, updateUser);
router.put( "/freeze", protectRoute, freezeAccount );

router.post("/register", register);
router.post("/verify", verifyEmail);
router.post("/resend-code", resendCode);
router.post("/login", login);
router.post( "/forgot-password", forgotPassword );
router.post( "/reset-password", resetPassword );
router.post( "/change-password", protectRoute, changePassword );

// Google auth routes
router.get(
	'/google',
	passport.authenticate('google', {
	  scope: ['profile', 'email']
	})
  );
  
  router.get(
	'/google/callback',
	passport.authenticate('google', {
	  failureRedirect: '/login',
	  session: false
	}),
	googleAuthSuccess
  );










export default router;
