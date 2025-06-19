// @ts-nocheck
import express from "express";

import protectRoute from "../middlewares/protectRoute.js";
import auth from "../middlewares/authMiddleware.js";
import { resumeUpload, photoUpload } from "../middlewares/upload.js";
import { logoutUser,updateUser,register,verifyEmail,login,forgotPassword,resetPassword,changePassword,resendCode, getEmployerProfile } from "../controllers/employerController.js";

const EmployerRouter = express.Router();


EmployerRouter.post("/logout", logoutUser);

EmployerRouter.post("/register", register);
EmployerRouter.post("/verify", verifyEmail);
EmployerRouter.post("/resend-code", resendCode);
EmployerRouter.post("/login", login);
EmployerRouter.post("/forgot-password",protectRoute, forgotPassword);
EmployerRouter.post("/reset-password", protectRoute, resetPassword);
EmployerRouter.post( "/change-password", protectRoute, changePassword );
EmployerRouter.put( "/update/:id", protectRoute, updateUser );
EmployerRouter.get("/profile/:query", getEmployerProfile);








export default EmployerRouter;
