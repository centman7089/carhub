// @ts-nocheck
import express from "express";
import { addEducation, addExperience, getProfile, resume, resumeUrl } from "../controllers/InternProfile.js";
import protectRoute from "../middlewares/protectRoute.js";
// import multer from "multer";


const internRouter = express.Router()

internRouter.get( '/me',protectRoute, getProfile )
internRouter.patch( '/experience', addExperience)
internRouter.patch( '/education', addEducation)


export default internRouter