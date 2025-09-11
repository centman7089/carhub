// @ts-nocheck
import express from "express";
import passport from "passport"
// import { issueTokenAndRedirect } from "../db/passport.js"
import { keys } from "../db/Key.js";

import {
    
    getDealerProfile,
    logoutUser,
    updateDealer,
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
    getDealerById,
    getMyProfile,
    updateProfilePhoto
   
} from "../controllers/dealerController.js";
import protectDealer from "../middlewares/protectDealer.js";

import multer from "multer";
import {uploadDocument,uploadProfilePhoto} from "../middlewares/upload.js";

// function generateToken(dealer) {
//     return jwt.sign({ id: dealer._id }, keys.jwtSecret, { expiresIn: "7d" });
//   }



const dealerRouter = express.Router();

dealerRouter.get("/profile/:query",protectDealer, getDealerProfile);
dealerRouter.post("/logout", protectDealer,logoutUser);
dealerRouter.post("/register", register);
dealerRouter.post("/verify", verifyEmail);
dealerRouter.post("/resend-code", resendCode);
dealerRouter.post("/verify-reset-code", verifyResetCode);
dealerRouter.post("/login", login);
dealerRouter.post( "/forgot-password", forgotPassword );
dealerRouter.post( "/reset-password", resetPassword );
dealerRouter.post( "/change-password", protectDealer, changePassword );
dealerRouter.get("/me", protectDealer, getMyProfile )

// Upload identity documents
dealerRouter.post(
  "/:dealerId/documents",
  protectDealer,
  uploadDocument.fields([
    { name: "idCardFront", maxCount: 1 },
    { name: "driverLicense", maxCount: 1 },
    // { name: "tin", maxCount: 1 },
    // { name: "bankStatement", maxCount: 1 },
    { name: "cac", maxCount: 1 }
  ]),
  uploadDocuments
);
dealerRouter.patch( "/update/:id", protectDealer, updateDealer );
dealerRouter.get("/:dealerId", protectDealer, getDealerById)
dealerRouter.patch(
  "/:userId/profile-photo",
  uploadProfilePhoto.single("profilePic"), // input name: profilePic
  updateProfilePhoto
);

// Accept terms
dealerRouter.post("/:dealerId/terms", protectDealer, acceptTerms);

// Admin approves
// dealerRouter.post("/:userId/approve", approveUser);


export default dealerRouter;
