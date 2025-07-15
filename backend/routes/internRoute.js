// @ts-nocheck
import express from "express";
import { addEducation, addExperience, getProfile, getUserProfile, updateInternProfilePhoto } from "../controllers/InternProfile.js";
import protectRoute from "../middlewares/protectRoute.js";
import { resumeUpload, uploadPhoto } from "../middlewares/upload.js";

// import multer from "multer";


const internRouter = express.Router()

internRouter.get( '/me',protectRoute, getProfile )
internRouter.patch( '/experience', addExperience)
internRouter.patch( '/education', addEducation )
internRouter.get( "/profile/:id", getUserProfile );
internRouter.put( "/photo", protectRoute, uploadPhoto.single('photo'), updateInternProfilePhoto );



export default internRouter