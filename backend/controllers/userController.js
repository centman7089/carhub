// @ts-nocheck
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import generateCode from "../utils/generateCode.js";
import sendEmail from "../utils/sendEmails.js";
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid";
import path from "path";
import axios from "axios";
// const fs = require( 'fs' ).promises; // Import the promises version of fs
import fs from 'fs';
import { promises as fsp } from 'fs'; // for promise-based operations

// In-memory session store (use Redis in production)
const resetSessions = new Map()

// Generate session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex")
}
// or alternatively:
// import fs from 'fs/promises';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});


const getUserProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		}

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
	}
};

const register = async ( req, res ) =>
{
	try {
		const {firstName,lastName,email,password, phone, country,state,city, address } = req.body;
		const userExists = await User.findOne({ email });
		  if ( !firstName || !lastName || !email || !password || !phone || !country || !state || !city || !address  ) {
			return res.status(404).json({message: "All fields are required"});
		  }
	

		if (userExists) {
			return res.status(400).json({ error: "User already exists" });
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const code = generateCode();

		const user = await User.create({
			firstName,
			lastName,
			email,
			password: hashedPassword,
			phone,
			country,
			state,
			city,
			address,
			emailCode: code,
			emailCodeExpires: Date.now() + 10 * 60 * 1000 ,// 10 mins
			passwordHistory: [ { password: hashedPassword, changedAt: new Date() } ],
			isVerified: false
		} );
		
	    // @ts-ignore
	    await sendEmail(email, "Verify your email", `Your verification code is: ${code}`);
    

		if (user) {
			generateTokenAndSetCookie(user._id, res);

			res.status(201).json({
				_id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phone: user.phone,
				country: user.country,
				state: user.state,
				city: user.city,
				address: user.address,
				username: user.username,
				bio: user.bio,
				profilePic: user.profilePic,
				msg: "User registered. Verification code sent to email."
			})
			
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log( "Error in signupUser: ", err.message );
		res.status(500).json({ msg: err.message });
	}
}



const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne( { email} );
		if (!user || !user.isVerified) return res.status(400).json({ msg: "Invalid credentials or unverified email" });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!isPasswordCorrect) return res.status(400).json({ error: "Invalid email or password" });

		if (user.isFrozen) {
			user.isFrozen = false;
			await user.save();
		}

		const token = generateTokenAndSetCookie(user._id, res);

		res.status( 200 ).json( {
			token,
			_id: user._id,
			email: user.email,
			msg: "Login Successful" 
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in loginUser: ", error.message);
	}
};

const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

const followUnFollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString())
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

qwweeh
		if (isFollowing) {
			// Unfollow user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in followUnFollowUser: ", err.message);
	}
};

const updateUser = async (req, res) => {
	const { firstName, lastName,email,phone,country, state, city, address } = req.body;
	let { profilePic } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

		user.firstName = firstName || user.firstName;
		user.lastName = lastName || user.lastName;
		user.email = email || user.email;
		user.phone = phone || user.phone;
		user.country = country || user.country;
		user.state = state || user.state;
		user.city = city || user.city;
		user.address = address || user.address;
		user.profilePic = profilePic || user.profilePic;

		user = await user.save();

		// Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};

const getSuggestedUsers = async (req, res) => {
	try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const freezeAccount = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Verify Email
const verifyEmail = async (req, res) => {
	try {
	  const { email, code } = req.body;
	  const user = await User.findOne({ email });
  
	  if (!user || user.isVerified) return res.status(400).json({ msg: "Invalid request" });
  
	  if (user.emailCode !== code || Date.now() > user.emailCodeExpires)
		return res.status(400).json({ msg: "Code expired or incorrect" });
  
	  user.isVerified = true;
	  user.emailCode = null;
	  user.emailCodeExpires = null;
	  await user.save();
  
	  res.json({ msg: "Email verified successfully" });
	} catch (err) {
	  res.status(500).json({ msg: err.message });
	}
  };
  
  // Resend Verification Code
  const resendCode = async (req, res) => {
	try {
	  const { email } = req.body;
	  const user = await User.findOne({ email });
  
	  if (!user || user.isVerified) return res.status(400).json({ msg: "User not found or already verified" });
  
	  const code = generateCode();
	  user.emailCode = code;
	  user.emailCodeExpires = Date.now() + 10 * 60 * 1000;
	  await user.save();
  
	  await sendEmail(email, "New verification code", `Your new code is: ${code}`);
	  res.json({ msg: "New verification code sent" });
	} catch (err) {
	  res.status(500).json({ msg: err.message });
	}
  };
  // Forgot Password
const forgotPassword = async (req, res) => {
	try {
	  const { email } = req.body;
	  const user = await User.findOne({ email });
  
	  if (!user) return res.status(400).json({ msg: "Email not found" });
  
	  const code = generateCode();
	  user.resetCode = code;
	  user.resetCodeExpires = Date.now() + 10 * 60 * 1000;
	  await user.save();
  
	  await sendEmail(email, "Password Reset Code", `Your reset code is: ${code}`);
	  res.json({ msg: "Password reset code sent" });
	} catch (err) {
	  res.status(500).json({ msg: err.message });
	}
  };
  
  // Reset Password
  const resetPassword = async (req, res) => {
	try {
	  const { email, code, newPassword, confirmPassword } = req.body;
	  const user = await User.findOne({ email });
  
	  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires)
		return res.status(400).json({ msg: "Invalid or expired code" });
  
	  if (newPassword !== confirmPassword)
		return res.status(400).json({ msg: "Passwords do not match" });
  
	  const hashed = await bcrypt.hash(newPassword, 10);
	  user.password = hashed;
	  user.resetCode = null;
	  user.resetCodeExpires = null;
	  await user.save();
  
	  res.json({ msg: "Password has been reset" });
	} catch (err) {
	  res.status(500).json({ msg: err.message });
	}
  };
  

  // Forgot Password

  // Change Password (Requires token)
  const changePassword = async (req, res) => {
	try {
	  const userId = req.user.id;
	  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  
	  if (newPassword !== confirmNewPassword) {
		return res.status(400).json({ msg: "New passwords do not match" });
	  }
  
	  const user = await User.findById(userId);
	  if (!user) return res.status(404).json({ msg: "User not found" });
  
	  const isMatch = await bcrypt.compare(currentPassword, user.password);
	  if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });
  
	  // Check if newPassword is same as current password
	  const isSame = await bcrypt.compare(newPassword, user.password);
	  if (isSame) return res.status(400).json({ msg: "New password cannot be the same as the old password" });
  
	  // Check password history
	  for (let entry of user.passwordHistory || []) {
		const reused = await bcrypt.compare(newPassword, entry.password);
		if (reused) {
		  return res.status(400).json({ msg: "You have already used this password before" });
		}
	  }
  
	  // Hash new password
	  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
	  // Update password and push current password to history
	  const updatedHistory = user.passwordHistory || [];
	  updatedHistory.push({ password: user.password, changedAt: new Date() });
  
	  // Keep only last 5 passwords
	  while (updatedHistory.length > 5) {
		updatedHistory.shift();
	  }
  
	  user.password = hashedPassword;
	  user.passwordHistory = updatedHistory;
	  await user.save();
  
	  res.json({ msg: "Password changed successfully" });
  
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ msg: "Server error" });
	}
  };


  
  const uploadFromUrl = async (req, res) => {
	const { fileUrl } = req.body;
	
	if (!fileUrl) {
	  return res.status(400).json({ error: "File URL is required" });
	}
  
	// Ensure temp_uploads directory exists
	const tempDir = 'temp_uploads';
	if (!fs.existsSync(tempDir)) {
	  fs.mkdirSync(tempDir, { recursive: true });
	}
  
	const tempPath = path.join(tempDir, uuidv4());
	
	try {
	  const response = await axios({
		url: fileUrl,
		method: "GET",
		responseType: "stream",
	  });
  
	  const writer = fs.createWriteStream(tempPath);
	  response.data.pipe(writer);
  
	  await new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	  });
  
	  const cloudRes = await cloudinary.uploader.upload(tempPath, {
		resource_type: "auto",
	  });
  
	  await fsp.unlink(tempPath);
  
	  const newFile = new User({
		originalUrl: fileUrl,
		cloudinaryUrl: cloudRes.secure_url,
		fileType: cloudRes.resource_type,
	  });
  
	  await newFile.save();
	  res.status(200).json({ message: "Uploaded successfully", file: newFile });
	} catch (err) {
	  console.error('Upload error:', err);
	  try {
		if (fs.existsSync(tempPath)) {
		  await fsp.unlink(tempPath);
		}
	  } catch (unlinkErr) {
		console.error('Error deleting temp file:', unlinkErr);
	  }
	  res.status(500).json({ 
		error: err.message || "Error processing file upload",
		details: err.response?.data || null
	  });
	}
  };

  const uploadFromLocal = async (req, res) => {
	try {
	  const cloudRes = await cloudinary.uploader.upload(req.file?.path, {
		resource_type: "auto",
	  });
  
	  if (req.file?.path) await fs.unlink(req.file.path).catch(() => {}); // delete temp file
  
	  const newFile = new User({
		originalUrl: null,
		cloudinaryUrl: cloudRes.secure_url,
		fileType: cloudRes.resource_type,
	  });
  
	  await newFile.save();
	  res.status(200).json({ message: "Uploaded successfully", file: newFile });
	} catch (err) {
	  console.log(err);
	  // Clean up temp file if it exists
	  if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
	  res.status(500).json({ error: "Cloudinary upload failed" });
	}
  }
export {
	register,
	login,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	freezeAccount,
	verifyEmail,
	resendCode,
	forgotPassword,
	resetPassword,
	changePassword,
	uploadFromUrl,
	uploadFromLocal,
	
};
