import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensures HTTPS URLs
});

// Utility functions
const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        ...options
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

const deleteFromCloudinary = async (publicId, options = {}) => {
  return cloudinary.uploader.destroy(publicId, options);
};

export {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};