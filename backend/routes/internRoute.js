// @ts-nocheck
import express from "express";
import { addEducation, addExperience, getAllInterns, getInternsByCourse, getInternsGroupedByCourse, getProfile, getUserProfile, updateInternProfilePhoto, updateProfile } from "../controllers/InternProfile.js";
import protectRoute from "../middlewares/protectRoute.js";
import { resumeUpload, uploadPhoto } from "../middlewares/upload.js";

// import multer from "multer";


const internRouter = express.Router()

internRouter.get( '/me', protectRoute, getProfile )
internRouter.get('/', getAllInterns)
internRouter.patch( '/experience', addExperience)
internRouter.patch( '/education', addEducation )
internRouter.put( "/photo", protectRoute, uploadPhoto.single( 'photo' ), updateInternProfilePhoto );
internRouter.patch( '/update/:id', protectRoute, updateProfile );
internRouter.get( "/grouped-by-course", getInternsGroupedByCourse );
internRouter.get( '/by-course/:courseId', getInternsByCourse );
internRouter.get( "/:id", getUserProfile );



export default internRouter