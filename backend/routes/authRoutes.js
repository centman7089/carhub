// @ts-nocheck
import express from 'express';
import {
  register,
  login,
  uploadDocuments,
  acceptTerms,
  logoutUser,
  getUserProfile
} from '../controllers/authController.js';
import protectRoute from '../middlewares/protectRoute.js';
import upload from "../utils/upload.js"


const authRouter = express.Router();

// Registration with document
authRouter.post('/register', upload.single('document'), register);

// Auth routes
authRouter.post('/login', login);
authRouter.get('/me', protectRoute, getUserProfile);
authRouter.post('/logout', logoutUser);

// Step 2: Upload identity documents (Car Dealers only)
authRouter.post(
  '/upload-documents/:userId',
  upload.fields([
    { name: 'idCardFront', maxCount: 1 },
    { name: 'driverLicense', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 },
  ]),
  uploadDocuments
);

// Step 3: Accept terms
authRouter.post('/accept-terms/:userId', acceptTerms);

// Test route for single doc upload
authRouter.post('/upload-doc', upload.single('document'), (req, res) => {
  res.status(200).json({ url: req.file.path });
});

export default authRouter;
