// @ts-nocheck
import express from "express";
import { addEducation, addExperience, getProfile, getUserProfile } from "../controllers/InternProfile.js";
import protectRoute from "../middlewares/protectRoute.js";
// import multer from "multer";


const internRouter = express.Router()

internRouter.get( '/me',protectRoute, getProfile )
internRouter.patch( '/experience', addExperience)
internRouter.patch( '/education', addEducation )
internRouter.get("/profile/:id", getUserProfile);


export default internRouter