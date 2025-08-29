import express from "express"
import {getNotifications, markAsRead} from "../controllers/notificationController.js"
const router = express.Router();

import protectRoute from "../middlewares/protectRoute.js";

router.get('/', protectRoute,getNotifications );
router.put('/:id/read', protectRoute, markAsRead);

export default router
