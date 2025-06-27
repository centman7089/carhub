// @ts-nocheck
import Admin from "../models/adminModel.js"

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
      user = await Admin.findOne({ _id: query }).select("-password").select("-updatedAt");
    } else {
      // query is username
      user = await Admin.findOne({ username: query }).select("-password").select("-updatedAt");
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in getUserProfile: ", err.message);
  }
};

const createAdmin = async ( req, res ) =>
{
  try {
    const {firstName,lastName,email,password, phone, country,role } = req.body;
    const userExists = await Admin.findOne({ email });
      if ( !firstName || !lastName || !email || !password || !phone || !country   ) {
      return res.status(404).json({message: "All fields are required"});
      }
  

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const code = generateCode();

    const user = await Admin.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      country,
      role,
      emailCode: code,
      emailCodeExpires: Date.now() + 10 * 60 * 1000 ,// 10 mins
      passwordHistory: [ { password: hashedPassword, changedAt: new Date() } ],
      isVerified: false
    } );
    
      // @ts-ignore
      await sendEmail(email, "Verify Admin email", `Your verification code is: ${code}`);
    

    if (user) {
      generateTokenAndSetCookie(user._id, res);

      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        role: user.role,
        profilePic: user.profilePic,
        msg: "Admin registered successfully. Verification code sent to email."
      })
      
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (err) {
  
    console.log( "Error in Registering Admin: ", err.message );
    res.status(500).json({ msg: err.message });
  }
}



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Admin.findOne({ email });
    
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
  
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
  
    if (!isPasswordCorrect) return res.status(400).json({ error: "Invalid email or password" });
  
    // If admin is not verified
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
  
 
  
    const token = generateTokenAndSetCookie(user._id, res);
  
    res.status(200).json({
    token,
    _id: user._id,
    email: user.email,
    msg: "Admin Login Successful",
    isVerified: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in login Admin: ", error.message);
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
  const { firstName, lastName,email,phone,country } = req.body;
  let { profilePic } = req.body;

  const userId = req.user._id;
  try {
    let user = await Admin.findById(userId);
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
    user.profilePic = profilePic || user.profilePic;

    user = await user.save();

   
    // password should be null in response
    user.password = null;

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in update Admin: ", err.message);
  }
};


// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await Admin.findOne({ email });
  
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
    const user = await Admin.findOne({ email });
  
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
    const user = await Admin.findOne({ email });
  
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

  const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
  
    if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ msg: "New passwords do not match" });
    }
  
    const user = await Admin.findById(userId);
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
    const user = await Admin.findOne({ email });
  
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
    const user = await Admin.findOne({ email });
  
    if (!user || !user.validateResetCode(code)) {
    return res.status(400).json({ message: "Invalid/expired Code" });
    }
  
    // Generate short-lived JWT (15 mins expiry)
    const token = jwt.sign(
    { userId: user._id, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
    );
  
    res.json({ success: true, token, message: "Code verified" });
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
  
    const user = await User.findById(decoded.userId);
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
  
const getAdminUser = async (req, res) => {
  try {
    const adminUsers = await Admin.find({ role: 'admin' }); // filter by role
    return res.status(200).json(adminUsers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

   
export {
  createAdmin,
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
  getAdminUser
};
