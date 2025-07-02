// @ts-nocheck
import express from "express";
import { addEducation, addExperience, getProfile, resume, resumeUrl } from "../controllers/InternProfile.js";
import protectRoute from "../middlewares/protectRoute.js";
// import multer from "multer";


const internRouter = express.Router()

// Configure multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/resumes/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
//     }
//   });
  
// const upload = multer( {
//   storage,
//   limits: { fileSize: 10000000 }, // 10MB limit
//   fileFilter: ( req, file, cb ) =>
//   {
//     const filetypes = /pdf|doc|docx/;
//     const extname = filetypes.test( path.extname( file.originalname ).toLowerCase() );
//     const mimetype = filetypes.test( file.mimetype );
  
//     if ( extname && mimetype )
//     {
//       return cb( null, true );
//     } else
//     {
//       cb( 'Error: Only PDF and Word documents are allowed!' );
//     }
//   }
// } );

//@route GET /api/auth/google
// internRouter.get( "/course",protectRoute, getAllCourse )
// internRouter.get( '/skills/:courseId',protectRoute, getAllCourse )
// internRouter.get( '/save',protectRoute, SaveOnboarding )
internRouter.get( '/me',protectRoute, getProfile )
// internRouter.post( '/resume',protectRoute, upload.single('resume'), resume )
// internRouter.post( '/resume-url',protectRoute,upload.single('resume'), resumeUrl )
internRouter.patch( '/experience', addExperience)
internRouter.patch( '/education', addEducation)


export default internRouter