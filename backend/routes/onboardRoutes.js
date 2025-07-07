// @ts-nocheck
import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { getCourseSkill, getAllCourse,setActiveResume, deleteResume, saveUrlResume, CompleteOnboarding, uploadResumeCloud, updateUrlResume, validateUrlResume, getUserResumes } from "../controllers/onboardingController.js";
// const { resumeStorage } = require( '../db/config/cloudinary.js' );
// import { resumeStorage } from "../db/config/cloudinary.js";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import
  {
    CloudinaryStorage
  
 } from "multer-storage-cloudinary";
import { resumeUpload } from "../middlewares/upload.js";



const onboardRouter = express.Router()






//@route GET /api/auth/google
onboardRouter.get( "/course", protectRoute,getAllCourse )
onboardRouter.get( '/skills/:courseId', protectRoute,getCourseSkill  )
onboardRouter.post('/save-url-resume', protectRoute,validateUrlResume, saveUrlResume )
onboardRouter.post('/upload-resume', protectRoute,resumeUpload.single('resume'),uploadResumeCloud )
onboardRouter.post('/complete', protectRoute, CompleteOnboarding)
onboardRouter.get('/resumes', protectRoute, getUserResumes);
onboardRouter.patch( '/set-active-resume/:resumeId/active', protectRoute, setActiveResume )
onboardRouter.delete( '/delete-resume/:resumeId', protectRoute, deleteResume )
onboardRouter.patch('/update-resume/:resumeId', protectRoute, updateUrlResume);



export default onboardRouter