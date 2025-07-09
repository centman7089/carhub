// @ts-nocheck
import fs from "fs/promises";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
	try {
	  const { text } = req.body;
	  const postedBy = req.user?._id;
  
	  if (!text) return res.status(400).json({ error: "Text field is required" });
  
	  /* ── 1. optional image upload ───────────────────────────────────── */
	  let imgUrl = "";
	  if (req.file) {
		const uploadRes = await cloudinary.uploader.upload(req.file.path, {
		  folder: "posts",
		});
		imgUrl = uploadRes.secure_url;
  
		// remove temp file so the server doesn’t fill up
		await fs.unlink(req.file.path);
	  }
  
	  /* ── 2. create & return the post ───────────────────────────────── */
	  const newPost = await Post.create({ postedBy, text, img: imgUrl });
	  res.status(201).json(newPost);
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ error: err.message });
	}
  };

//To get a particular post
const getPost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		res.status(200).json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// PUT /api/posts/:id
const updatePost = async (req, res) => {
	try {
	  const { text, img } = req.body;      // any (or both) may be absent
	  const postId  = req.params.id;
	  const userId  = req.user._id;
  
	  const post = await Post.findById(postId);
	  if (!post) return res.status(404).json({ error: "Post not found" });
  
	  // Only the author may edit
	  if (post.postedBy.toString() !== userId.toString()) {
		return res.status(401).json({ error: "Unauthorized to update post" });
	  }
  
	  /* ───── text update ───── */
	  if (typeof text !== "undefined") {
		const maxLength = 500;
		if (text && text.length > maxLength) {
		  return res
			.status(400)
			.json({ error: `Text must be ≤ ${maxLength} characters` });
		}
		post.text = text;                       // allows empty string → clears text
	  }
  
	  /* ───── image update / removal ───── */
	  if (typeof img !== "undefined") {
		// 1. Delete previous image (if any)
		if (post.img) {
		  const publicId = post.img            // works with or without folder
			.substring(post.img.lastIndexOf("/") + 1)
			.split(".")[0];
		  await cloudinary.uploader.destroy(publicId);
		  post.img = undefined;                // clear stored URL
		}
  
		// 2. If a NEW image was supplied, upload & save its URL
		if (img) {                             // falsy ("", null) → just remove
		  const upload = await cloudinary.uploader.upload(img);
		  post.img = upload.secure_url;
		}
	  }
  
	  await post.save();
	  res.status(200).json(post);
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ error: err.message });
	}
  };
  

const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};



const likeUnlikePost = async (req, res) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const replyToPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const reply = { userId, text, userProfilePic, username };

		post.replies.push(reply);
		await post.save();

		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getFeedPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = user.following;

		const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 });

		res.status(200).json(feedPosts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getUserPosts = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts, updatePost };
