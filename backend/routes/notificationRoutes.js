// import express from "express"
// import {getNotifications, markAsRead} from "../controllers/notificationController.js"
// const router = express.Router();

// import protectRoute from "../middlewares/protectRoute.js";

// router.get('/', protectRoute,getNotifications );
// router.put('/:id/read', protectRoute, markAsRead);

// export default router

import express from "express";
import {
  createNotification,
  getUserNotifications,
  markAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// POST /api/notifications
router.post("/", createNotification);

// GET /api/notifications/:dealerId
router.get("/:dealerId", getUserNotifications);

// PATCH /api/notifications/read/:id
router.patch("/read/:id", markAsRead);

export default router;
