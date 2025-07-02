// @ts-nocheck
import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { getCourseSkill, getAllCourse,setActiveResume, deleteResume, saveUrlResume, CompleteOnboarding } from "../controllers/onboardingController.js";
// const { resumeStorage } = require( '../db/config/cloudinary.js' );
import { resumeStorage } from "../db/config/cloudinary.js";
import multer from "multer";


const onboardRouter = express.Router()

// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });


// Configure multer for resume uploads
// const resumeStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/resumes/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, `resume-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
//     }
//   });
  
  // Configure Multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
      cb(null, `resume-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
    }
  }
});

//@route GET /api/auth/google
onboardRouter.get( "/course", getAllCourse )
onboardRouter.get( '/skills/:courseId', getCourseSkill  )
onboardRouter.post('/save-url-resume', protectRoute, saveUrlResume )
onboardRouter.post( '/set-active-resume/:resumeId', protectRoute, setActiveResume)
onboardRouter.post( '/delete-resume/:resumeId', protectRoute, deleteResume)
onboardRouter.post('/complete', protectRoute, CompleteOnboarding)


export default onboardRouter