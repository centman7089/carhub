// @ts-nocheck
import Employer from "../models/employerModel.js"
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


const getEmployerProfile = async (req, res) => {
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
		const {companyName, email, password, logo,description} = req.body;
		const userExists = await User.findOne({ email });
		  if ( !companyName || !email || !password || !logo || !description) {
			return res.status(404).json({message: "All fields are required"});
		  }
	

		if (userExists) {
			return res.status(400).json({ error: "Employer already exists" });
		}
		

		const code = generateCode();

		const user = await Employer.create({
			companyName,
			email,
			password,
			logo,
			description,
			emailCode: code,
			emailCodeExpires: Date.now() + 10 * 60 * 1000 ,// 10 mins
			passwordHistory: [ { password, changedAt: new Date() } ],
			isVerified: false
		} );

		
		  await user.save();
		
	    // @ts-ignore
	    await sendEmail(email, "Verify your email", `Your verification code is: ${code}`);
    


		if (user) {
			generateTokenAndSetCookie(user._id, res);

			res.status(201).json({
				_id: user._id,
				companyName: user.companyName,
				email: user.email,
				logo: user.logo,
				description: user.description,
				msg: "User registered. Verification code sent to email."
			})
			
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch ( err )
	{
		console.log(err);
		
		res.status(500).json({ error: err.message });
		console.log( "Error in registering Employer: ", err.message );
		res.status(500).json({ msg: err.message });
	}
}



const login = async (req, res) => {
	try {
	  const { email, password } = req.body;
	  const user = await Employer?.findOne({ email });
	  
		if ( !user )
		{
			return res.status(400).json({ msg: "Invalid credentials" });
	  }
  
	  const isPasswordCorrect = await user.correctPassword(password); // Use the schema method
        
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid password" }); // More specific
        }
  
	  // If user is not verified
	  if (!user.isVerified) {
		// Generate new verification code
		const code = generateCode();
		user.emailCode = code;
		user.emailCodeExpires = Date.now() + 10 * 60 * 1000; // 10 mins
		await user.save();
  
		// Send verification email
		await sendEmail(
		  email,
		  "New Verification Code",
		  `Your new verification code is: ${code}`
		);
  
		return res.status(403).json({ 
		  msg: "Account not verified. A new verification code has been sent to your email.",
		  isVerified: false 
		});
	  }
  
	//   if (user.isFrozen) {
	// 	user.isFrozen = false;
	// 	await user.save();
	//   }
  
	  const token = generateTokenAndSetCookie(user._id, res);
  
	  res.status(200).json({
		token,
		_id: user._id,
		email: user.email,
		msg: "Login Successful",
		isVerified: true
	  });
	} catch ( error )
	{
		console.log(error);
		
	  res.status(500).json({ error: error.message });
	  console.log("Error in loginEmployer: ", error.message);
	}
};

const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupEmployee: ", err.message);
	}
};


const updateUser = async (req, res) => {
	const { companyName, email, description } = req.body;
	let { logo } = req.body;

	const userId = req.user._id;
	try {
		let user = await Employer.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		if (logo) {
			if (user.logo) {
				await cloudinary.uploader.destroy(user.logo.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(logo);
			logo = uploadedResponse.secure_url;
		}

		user.companyName = companyName || user.companyName;
		user.email = email || user.email;
		user.description = description || user.description;
		user.logo = logo || user.logo;

		user = await user.save();

		

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};



// Verify Email
const verifyEmail = async (req, res) => {
	try {
	  const { email, code } = req.body;
	  const user = await Employer.findOne({ email });
  
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
const verifyPasswordResetCode = async (req, res) => {
	try {
	  const { email, code } = req.body;
	  const user = await Employer.findOne({ email });
  
	//   if (!user || user.isVerified) return res.status(400).json({ msg: "Invalid request" });
  
	  if (user.resetCode !== code || Date.now() > user.reseCodeExpires)
		return res.status(400).json({ msg: "Code expired or incorrect" });
  
	  user.isVerified = true;
	  user.resetCode = null;
	  user.resetCodeExpires = null;
	  await user.save();
  
	  res.json({ msg: "code verified successfully" });
	} catch (err) {
	  res.status(500).json({ msg: err.msg });
	}
  };
  
  // Resend Verification Code
  const resendCode = async (req, res) => {
	try {
	  const { email } = req.body;
	  const user = await Employer.findOne({ email });
  
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

  
  // Reset Password


  // Forgot Password

  // Change Password (Requires token)
  const changePassword = async (req, res) => {
	try {
	  const userId = req.user.id;
	  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  
	  if (newPassword !== confirmNewPassword) {
		return res.status(400).json({ msg: "New passwords do not match" });
	  }
  
	  const user = await Employer.findById(userId);
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



const forgotPassword = async (req, res) => {
	try {
	  const { email } = req.body;
	  const user = await Employer.findOne({ email });
  
		if ( !user )
		{
			return res.status(400).json({ msg: "Email not found" });
	  }
  
		const code = user.setPasswordResetCode();
		await user.save({validateBeforeSave: false})
	  await sendEmail(email, "Password Reset Code", `Your reset code is: ${code}`);
	  res.json({ msg: "Password reset code sent" });
	} catch (err) {
	  res.status(500).json({ msg: err.message });
	}
  };
  

  const verifyResetCode = async (req, res) => {
	try {
	  const { email, code} = req.body;
	  const user = await Employer.findOne({ email });
  
	  if (!user || !user.validateResetCode(code)) {
		return res.status(400).json({ message: "Invalid/expired OTP" });
	  }
  
	  // Generate short-lived JWT (15 mins expiry)
	  const token = jwt.sign(
		{ userId: user._id, purpose: "password_reset" },
		process.env.JWT_SECRET,
		{ expiresIn: "15m" }
	  );
  
	  res.json({ success: true, token, message: "OTP verified" });
	} catch (error) {
	  res.status(500).json({ message: "Server error" });
	}
  };
// Step 3 – change the password with the JWT
const resetPassword = async (req, res) => {
	try {
	  const { token, newPassword, confirmPassword } = req.body;
  
	  if (newPassword !== confirmPassword) {
		return res.status(400).json({ message: "Passwords do not match" });
	  }
  
	  // Verify JWT
	  const decoded = jwt.verify(token, process.env.JWT_SECRET);
	  if (decoded.purpose !== "password_reset") {
		return res.status(400).json({ message: "Invalid token" });
	  }
  
	  const user = await Employer.findById(decoded.userId);
	  if (!user) {
		return res.status(404).json({ message: "User not found" });
	  }
  
	  // Update password & clear OTP
	  user.password = newPassword;
	  user.otp = undefined;
	  user.otpExpires = undefined;
	  await user.save();
  
	  res.json({ success: true, message: "Password updated" });
	} catch (error) {
	  if (error.name === "TokenExpiredError") {
		return res.status(400).json({ message: "Token expired" });
	  }
	  res.status(500).json({ message: "Server error" });
	}
};
  

   
export {
	register,
	login,
	logoutUser,
	updateUser,
	getEmployerProfile,
	verifyEmail,
	resendCode,
	verifyResetCode,
	forgotPassword,
	resetPassword,
	changePassword
	
};
