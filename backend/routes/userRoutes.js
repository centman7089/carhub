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



const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);

router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)

router.patch( "/freeze", protectRoute, freezeAccount );

router.post("/register", register);
router.post("/verify", verifyEmail);
router.post("/resend-code", resendCode);
router.post("/verify-reset-code", verifyResetCode);
router.post("/login", login);
router.post( "/forgot-password", forgotPassword );
router.post( "/reset-password", resetPassword );
router.post( "/change-password", protectRoute, changePassword );
router.patch("/update/:id", protectRoute, updateUser);


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
// router.get(
// 	'/google',
// 	passport.authenticate('google', {
// 	  scope: ['profile', 'email']
// 	})
//   );
  
//   router.get(
// 	'/google/callback',
// 	passport.authenticate('google', {
// 	  failureRedirect: '/login',
// 	  session: false
// 	}),
// 	googleAuthSuccess
//   );


// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${keys.clientURL}/oauth-success?token=${token}`);
} );

// GitHub
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback", passport.authenticate("github", { session: false }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${keys.clientURL}/oauth-success?token=${token}`);
});


// // Google
// router.get(
// 	"/google",
// 	passport.authenticate("google", { scope: ["profile", "email"] })
//   );
//   router.get("/google/callback", passport.authenticate("google"), issueTokenAndRedirect);
  
//   // Facebook
//   router.get(
// 	"/facebook",
// 	passport.authenticate("facebook", { scope: ["email"] })
//   );
//   router.get("/facebook/callback", passport.authenticate("facebook"), issueTokenAndRedirect);
  
  // GitHub
//   router.get(
// 	"/github",
// 	passport.authenticate("github", { scope: ["user:email"] })
//   );
//   router.get("/github/callback", passport.authenticate("github"), issueTokenAndRedirect);
  
//   // Verify token and get profile
//   router.get("/me", (req, res) => {
// 	const authHeader = req.headers.authorization;
// 	if (!authHeader) return res.sendStatus(401);
// 	const token = authHeader.split(" ")[1];
// 	try {
// 	  const payload = jwt.verify(token, process.env.JWT_SECRET);
// 	  res.json(payload);
// 	} catch {
// 	  res.sendStatus(401);
// 	}
//   });









export default router;
