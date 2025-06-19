// @ts-nocheck
import express from 'express';
import multer from 'multer';
import path from 'path';

import cloudinary from '../db/config/cloudinary.js';
import { fetchFileFromUrl } from '../utils/fetchFileFromUrl.js';
import { promises as fs } from 'fs';
import Resume from '../models/Resume.js';
import User from '../models/userModel.js';
import protectRoute from '../middlewares/protectRoute.js';
import { log } from 'console';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const uploadRouter = express.Router();

// @ts-nocheck
uploadRouter.post('/upload', protectRoute, upload.single('resume'), async (req, res) => {
  try {
    const userId = req.user?._id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let filePath;

    if (req.file) {
      // Local file upload
      filePath = req.file.path;
    } else if (req.body.fileUrl) {
      // URL file download
      filePath = await fetchFileFromUrl(req.body.fileUrl, 'Uploads');
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `resumes/${userId}`,
      resource_type: 'auto',
    });

    // Clean up temporary file
    await fs.unlink(filePath);

    // Save resume metadata to MongoDB
    const resume = await Resume.create({
      url: result.secure_url,
      public_id: result.public_id,
      userId,
    });

    // Update user's resumes array
    user.resumes.push(resume._id);
    await user.save();

    res.status(200).json({
      message: 'Resume uploaded successfully',
      url: result.secure_url,
      public_id: result.public_id,
      resumeId: resume._id,
    });
  } catch ( error )
  {
  
    
    // Clean up temporary file in case of error
    if (filePath) await fs.unlink(filePath).catch(() => {});
    res.status( 500 ).json( { error: error.message } );
    console.log(error);
  }
});

export default uploadRouter;