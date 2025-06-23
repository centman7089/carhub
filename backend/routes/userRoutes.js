// @ts-nocheck
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


// Multer configuration - accepts both documents and images
const upload = multer({ 
	dest: 'temp_uploads/',
	fileFilter: (req, file, cb) => {
	  const allowedMimeTypes = [
		// Documents
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		
		// Images
		'image/jpeg',
		'image/jpg',
		'image/png'
	  ];
  
	  if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	  } else {
		cb(new Error('Invalid file type. Only PDF, Word docs, JPG, JPEG, PNG allowed'), false);
	  }
	},
	limits: {
	  fileSize: 5 * 1024 * 1024 // 5MB
	}
  });
  
  // Upload from URL (already handles all file types via Cloudinary)
  router.post('/resume/url', protectRoute, uploadFromUrl);
  
  // Upload from local device (now accepts both docs and images)
  router.post('/resume/local', protectRoute, upload.single('resume'), uploadFromLocal);
  

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
