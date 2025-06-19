// @ts-nocheck
import express from "express";
import multer from "multer";
import axios from "axios";

import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();



/**
 * Upload file from public URL
 */


/**
 * Upload local file (PDF, image, doc)
 */


export default router;
