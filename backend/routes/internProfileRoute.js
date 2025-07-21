
import express from "express";
import {
   
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { addCustomSkill, getSkillsByCourse, removeSkill, updateCourses, updateInternProfile, updatePhoto, updateSkills, updateUser } from "../controllers/internProfileController.js";
import {  photoUpload,resumeUpload } from "../middlewares/upload.js";
import upload from "../utils/upload.js";



const internProfileRouter = express.Router();

// internProfileRouter.get("/", getAllInterns);
internProfileRouter.get('/me', protectRoute, );
internProfileRouter.get('/skills', protectRoute, getSkillsByCourse);
internProfileRouter.post('/update-skills', protectRoute, updateSkills);
internProfileRouter.post('/update-courses', protectRoute, updateCourses);
internProfileRouter.post('/add-skill', protectRoute, addCustomSkill);
internProfileRouter.post('/remove-skill', protectRoute, removeSkill);
internProfileRouter.patch( '/update-user', protectRoute, updateUser );
internProfileRouter.patch('/:id/change-avatar', protectRoute, upload.single("profilePic"), updatePhoto);
internProfileRouter.post(
  '/update-profile',
  protectRoute,
  (req, res, next) => {
    resumeUpload.single('resume')(req, res, function (err) {
      if (err) return res.status(400).json({ error: err.message });
      photoUpload.single('photo')(req, res, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        next();
      });
    });
  },
  updateInternProfile
);



export default internProfileRouter;
