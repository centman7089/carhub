import express from "express";
import {
	createPost,
	deletePost,
	getPost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getUserPosts,
	updatePost,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadSingleImage } from "../middlewares/imgUpload.js";

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:id",protectRoute, getPost);
router.get("/user/:userId", getUserPosts);
router.post("/create", uploadSingleImage, createPost);
router.delete( "/:id", protectRoute, deletePost );
router.put("/posts/:id", protectRoute, updatePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);

export default router;
