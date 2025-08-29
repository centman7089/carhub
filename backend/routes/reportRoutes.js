// @ts-nocheck
// const express = require( 'express' );
import express from "express"
const router = express.Router();
import {createReport, getAllReports, deleteReport} from "../controllers/reportController.js"

// const { isAdmin } = require('../middlewares/roleMiddleware');
import protectRoute from "../middlewares/protectRoute.js"
import {authorizeRoles} from "../middlewares/adminAuth.js"
 
// Submit a report
router.post('/', protectRoute, createReport);

// Admin: View all reports
router.get('/', protectRoute, authorizeRoles('admin'), getAllReports);

// Admin: Delete a report
router.delete('/:id', protectRoute, authorizeRoles('admin'), deleteReport);

 export default router
