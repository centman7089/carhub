import express from "express";
import {
   
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { addCourseSkills, getAllCourses, getSkillsByCourse } from "../controllers/courseController.js";


const courseRoute = express.Router();




courseRoute.post( '/', addCourseSkills )
courseRoute.get( '/courses', getAllCourses );
courseRoute.get('/:course', getSkillsByCourse)


export default courseRoute;
