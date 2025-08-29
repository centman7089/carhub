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


const userRouter = express.Router();

// Registration with document
userRouter.post('/register', upload.single('document'), register);

// Auth routes
userRouter.post('/login', login);
userRouter.get('/me', protectRoute, getUserProfile);
userRouter.post('/logout', logoutUser);

// Step 2: Upload identity documents (Car Dealers only)
userRouter.post(
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
userRouter.post('/accept-terms/:userId', acceptTerms);

// Test route for single doc upload
userRouter.post('/upload-doc', upload.single('document'), (req, res) => {
  res.status(200).json({ url: req.file.path });
});

export default userRouter;
