// @ts-nocheck
import User from "../models/userModel.js";

import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import generateCode from "../utils/generateCode.js";
import {sendEmail} from "../utils/sendEmails.js";
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid";
import path from "path";
import axios from "axios";
// const fs = require( 'fs' ).promises; // Import the promises version of fs
import fs from 'fs';
import { promises as fsp } from 'fs'; // for promise-based operations
import { profile } from "console";


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

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      state,
      city,
      streetAddress,
      zipCode,
      dateOfBirth,
      accountType,
      acceptedTerms,
      acceptedPrivacy,
    } = req.body;

    // 1. Validate required fields
    if (
      !firstName || !lastName || !email || !password || !phone || !country ||
      !state || !city || !streetAddress || !accountType || !dateOfBirth
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Validate account type
    if (!['car_dealer', 'retailer'].includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    // 3. Validate terms/privacy
    if (!acceptedTerms || !acceptedPrivacy) {
      return res.status(400).json({ message: "You must accept the Terms & Conditions and Privacy Policy" });
    }

    // 4. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "User already exists" });

    // 5. Generate email verification code
    const code = generateCode();

    // 6. Create user (no docs here, docs uploaded later)
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      state,
      city,
      streetAddress,
      zipCode,
      dateOfBirth,
      accountType,
      acceptedTerms,
      acceptedPrivacy,
      emailCode: code,
      emailCodeExpires: Date.now() + 10 * 60 * 1000,
      passwordHistory: [{ password, changedAt: new Date() }],
      isVerified: false,
      isApproved: accountType === "retailer" ? true : false,
      onboardingCompleted: false,
    });

    await newUser.save();

    // 7. Send email verification
    await sendEmail(email, "Verify your email", `Your verification code is: ${code}`);
    generateTokenAndSetCookie(newUser._id, res);

    // 8. Determine registration step
    let nextStep = "";
    if (!newUser.isVerified) {
      nextStep = "email_verification";
    } else if (newUser.accountType === "car_dealer" && !newUser.identityDocuments?.status) {
      nextStep = "document_upload";   // must upload document
    } else if (newUser.accountType === "car_dealer" && newUser.identityDocuments?.status === "pending") {
      nextStep = "admin_approval";    // waiting admin review
    } else if (newUser.accountType === "car_dealer" && newUser.identityDocuments?.status === "approved") {
      nextStep = "completed";         // dealer fully onboarded
    } else {
      nextStep = "completed";         // retailers after email verification
    }

    // 9. Respond
    res.status(201).json({
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      accountType: newUser.accountType,
      acceptedTerms: newUser.acceptedTerms,
      acceptedPrivacy: newUser.acceptedPrivacy,
      step: nextStep,
      msg: "User registered. Verification code sent to email."
    });
  } catch (err) {
    console.error("Error in register:", err);
    res.status(500).json({ error: err.message });
  }
};




  



const login = async (req, res) => {
	try {
	  const { email, password } = req.body;
	  const user = await User?.findOne({ email });
	  
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
	if (user.accountType === 'car_dealer' && !user.isApproved) {
		return res.status(403).json({ msg: "Awaiting admin approval", isVerified: user.isVerified, isApproved: false });
	  }
		
		
	  const token = generateTokenAndSetCookie(user._id, res);
  
	  res.status(200).json({
		token,
		_id: user._id,
		email: user.email,
		msg: "Login Successful",
		isVerified: true,
		onboardingCompleted: user.onboardingCompleted
	  });
	} catch ( error )
	{
		console.log(error);
		
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



const updateUser = async (req, res) => {
	const { firstName, lastName,email,phone,country, state, city, streetAddress } = req.body;
	let { profilePic } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		// if (password) {
		// 	const salt = await bcrypt.genSalt(10);
		// 	const hashedPassword = await bcrypt.hash(password, salt);
		// 	user.password = hashedPassword;
		// }

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

		// password should be null in response
		// user.password = null;

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


const verifyPasswordResetCode = async (req, res) => {
	try {
	  const { email, code } = req.body;
	  const user = await User.findOne({ email });
  
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

  
  // Reset Password


  // Forgot Password

  // Change Password (Requires token)
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const user = await user.findById(userId);
    if (!user) return res.status(404).json({ msg: "user not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Incorrect current password" });

    // Prevent setting same as current
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ msg: "New password cannot be the same as the old password" });
    }

    // Prevent reusing old passwords
    for (const entry of user.passwordHistory || []) {
      if (await bcrypt.compare(newPassword, entry.password)) {
        return res.status(400).json({ msg: "You have already used this password before" });
      }
    }

    // Store old password in history
    user.passwordHistory = user.passwordHistory || [];
    user.passwordHistory.push({
      password: user.password,
      changedAt: new Date(),
    });
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift();
    }

    // Assign new password in plain text — pre-save will hash it
    user.password = newPassword;
    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


  




const forgotPassword = async (req, res) => {
	try {
	  const { email } = req.body;
	  const user = await User.findOne({ email });
  
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
	  const user = await User.findOne({ email });
  
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
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent reusing current password
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: "New password cannot be the same as the old password" });
    }

    // Prevent reusing passwords from history
    for (const entry of user.passwordHistory || []) {
      if (await bcrypt.compare(newPassword, entry.password)) {
        return res.status(400).json({ message: "You have already used this password before" });
      }
    }

    // Save current hashed password into history
    user.passwordHistory = user.passwordHistory || [];
    user.passwordHistory.push({
      password: user.password,
      changedAt: new Date(),
    });
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift();
    }

    // Set new password in plain text — pre-save hook hashes
    user.password = newPassword;

    // Clear reset tokens
    user.emailCode = undefined;
    user.emailCodeExpires = undefined;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired" });
    }
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Step 2: Upload identity documents (Car Dealer only)
const uploadDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user || user.accountType !== "car_dealer") {
      return res.status(400).json({ error: "Invalid user or account type" });
    }

    // Allowed document fields
    const fields = ["idCardFront", "driverLicense", "insurance", "bankStatement"];

    // Ensure only one document uploaded
    const uploadedFields = fields.filter((field) => req.files[field]);
    if (uploadedFields.length === 0) {
      return res.status(400).json({ error: "You must upload exactly one document" });
    }
    if (uploadedFields.length > 1) {
      return res.status(400).json({ error: "Only one document can be uploaded at a time" });
    }

    const field = uploadedFields[0];
    const file = req.files[field][0];

    // Save document in user record
    user.identityDocuments = {
      type: field,
      url: file.path,
      status: "pending", // pending admin review
      uploadedAt: new Date(),
    };

    // Move onboarding step
    user.step = "admin_approval";
    await user.save();

    res.json({
      message: "Document uploaded successfully, pending admin approval",
      step: "admin_approval",
      document: user.identityDocuments,
    });
  } catch (err) {
    console.error("Error in uploadDocuments:", err);
    res.status(500).json({ error: err.message });
  }
};



  
  // Step 3: Accept Terms
const acceptTerms = async (req, res) => {
	try {
	  const { userId } = req.params;
	  const user = await User.findById(userId);
  
	  if (!user) return res.status(404).json({ error: 'User not found' });
  
	  user.termsAccepted = true;
  
	  // For Car Dealers, we leave isVerified false for admin to approve
	  if (user.accountType === 'Retailer') {
		user.isVerified = true;
	  }
  
	  await user.save();
	  res.json({ message: 'Terms accepted', user });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  };
  

   

export
{
	register,
	login,
	logoutUser,
    
	updateUser,
	getUserProfile,
	
	verifyEmail,
	resendCode,
	verifyResetCode,
	forgotPassword,
	resetPassword,
	changePassword,
	acceptTerms, uploadDocuments
	
};
