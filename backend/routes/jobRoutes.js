// @ts-nocheck
import express from "express";

import protectRoute from "../middlewares/protectRoute.js";
import { allJobs, applyJobs, recommendJob } from "../controllers/jobController.js";


const jobRouter = express.Router()



//@route GET /api/auth/google
jobRouter.get( "/", allJobs )
jobRouter.get( "/recommend",protectRoute, recommendJob )
jobRouter.post( '/apply/:job_id',protectRoute, applyJobs )



export default jobRouter