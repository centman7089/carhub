// @ts-nocheck
import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { getCourseSkill, getAllCourse,setActiveResume, deleteResume, saveUrlResume, CompleteOnboarding, uploadResumeCloud } from "../controllers/onboardingController.js";
// const { resumeStorage } = require( '../db/config/cloudinary.js' );
// import { resumeStorage } from "../db/config/cloudinary.js";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import
  {
    CloudinaryStorage
  
 } from "multer-storage-cloudinary";



const onboardRouter = express.Router()



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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jobseeker-resumes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto',
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // For images
  }
});

const upload = multer({ storage });

  
  // Configure Multer for file uploads
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/resumes/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, `resume-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
//     }
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: (req, file, cb) => {
//     const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
//     if (extname && mimetype) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
//     }
//   }
// });

//@route GET /api/auth/google
onboardRouter.get( "/course", getAllCourse )
onboardRouter.get( '/skills/:courseId', getCourseSkill  )
onboardRouter.post('/save-url-resume', protectRoute, saveUrlResume )
onboardRouter.post('/upload-resume', protectRoute, upload.single('resume') ,uploadResumeCloud )
onboardRouter.post( '/set-active-resume/:resumeId', protectRoute, setActiveResume )
onboardRouter.post('/complete', protectRoute, CompleteOnboarding)
onboardRouter.post('/complete', protectRoute, CompleteOnboarding)
onboardRouter.post( '/delete-resume/:resumeId', protectRoute, deleteResume )
onboardRouter.patch('/update-resume/:resumeId', protectRoute, updateUrlResume);



export default onboardRouter