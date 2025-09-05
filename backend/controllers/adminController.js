// @ts-nocheck
// const User = require('../models/User');
// const Car = require('../models/Car');

import Auction from "../models/Auction.js";


// @ts-nocheck
import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import generateCode from "../utils/generateCode.js";
import sendEmail from "../utils/sendEmails.js";
import mongoose from "mongoose";
import Employer from "../models/employerModel.js";
import User from "../models/userModel.js";
import Vehicle from "../models/Vehicle.js";

// In-memory session store (use Redis in production)
const resetSessions = new Map();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to safely format admin response
const formatAdminResponse = (admin) => ({
  _id: admin._id,
  firstName: admin.firstName || "",
  lastName: admin.lastName || "",
  email: admin.email || "",
  phone: admin.phone || "",
  country: admin.country || "",
  role: admin.role || "",
  profilePic: admin.profilePic || "",
  isVerified: admin.isVerified || false,
});

export const createAdmin = async ( req, res ) => {
	try
	{
		const {firstName, lastName, email, password, phone, country, role } = req.body;
		const adminExists = await Admin.findOne( { email } );
		if ( !firstName || !lastName || !email || !password || !phone || !country)
		{
			return res.status( 404 ).json( { message: "All fields are required" } );
		}


		if ( adminExists )
		{
			return res.status( 400 ).json( { error: "Admin already exists" } );
		}


		const code = generateCode();

		const admin = await Admin.create( {
			firstName,
			lastName,
			email,
			password,
			phone,
			country,
			role,
			emailCode: code,
			emailCodeExpires: Date.now() + 10 * 60 * 1000,// 10 mins
			passwordHistory: [ { password, changedAt: new Date() } ],
			isVerified: false
		} );


		await sendEmail( email, "Verify your email", `Your verification code is: ${ code }` );
		const token = generateTokenAndSetCookie( admin._id, res, "admin" );
		await admin.save()

		res.status( 201 ).json( {
			token,
		  _id: admin._id,
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      phone: admin.phone || "",
      country: admin.country || "",
      role: admin.role || "",
      profilePic: admin.profilePic || "",
      isVerified: admin.isVerified || false,
			msg: "Admin registered . Verification code sent to email.",
		} );
	} catch ( err )
	{
		console.log( err );

		res.status( 500 ).json( { error: err.message } );
		console.log( "Error in registering Employer: ", err.message );
		res.status( 500 ).json( { msg: err.message } );
	}
}


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isPasswordCorrect = await admin.correctPassword(password); // Use schema method
    if (!isPasswordCorrect) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    // Check email verification
    if (!admin.isVerified) {
      const code = generateCode();
      admin.emailCode = code;
      admin.emailCodeExpires = Date.now() + 10 * 60 * 1000;
      await admin.save();

      await sendEmail(email, "Verification Required", `Your new code: ${code}`);

      return res.status(403).json({
        msg: "Account not verified. New verification code sent.",
        isVerified: false,
      });
    }

 



    // Generate token and return success
    const token = generateTokenAndSetCookie(admin._id, res, "admin");

    return res.status(200).json({
      token,
      _id: admin._id,
      email: admin.email,
      msg: "Login successful",
      isVerified: true,
    });

  } catch (error) {
    console.error("Error in loginAdmin: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  const { query } = req.params;
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await Admin.findById(query).select("-password -updatedAt");
    } else {
      user = await Admin.findOne({ username: query }).select("-password -updatedAt");
    }

    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error("getUserProfile error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { firstName, lastName, email, phone, country } = req.body;
  let { logo } = req.body;
  const userId = req.admin._id;

  try {
    let admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    if (req.params.id !== adminId.toString()) {
      return res.status(403).json({ error: "Unauthorized update" });
    }

    if (profilePic && admin.profilePic) {
      await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
    }

    const uploadedPic = profilePic
      ? (await cloudinary.uploader.upload(profilePic)).secure_url
      : user.profilePic;

    Object.assign(admin, {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      phone: phone || user.phone,
      country: country || user.country,
      profilePic: uploadedPic,
    });

    await user.save();
    res.status( 200 ).json( {
        _id: admin._id,
  firstName: admin.firstName || "",
  lastName: admin.lastName || "",
  email: admin.email || "",
  phone: admin.phone || "",
  country: admin.country || "",
  role: admin.role || "",
  profilePic: admin.profilePic || "",
  isVerified: admin.isVerified || false,
    });
  } catch (err) {
    console.error("updateUser error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || admin.isVerified)
      return res.status(400).json({ msg: "Invalid request" });

    if (admin.emailCode !== code || Date.now() > admin.emailCodeExpires)
      return res.status( 400 ).json( { msg: "Code expired or incorrect" } );

    admin.isVerified = true;
    admin.emailCode = null;
    admin.emailCodeExpires = null;
    await admin.save();

    res.json({ msg: "Email verified successfully" });
    
    // if (
    //   !admin ||
    //   admin.isVerified ||
    //   admin.emailCode !== code ||
    //   Date.now() > admin.emailCodeExpires
    // ) {
    //   return res.status(400).json({ msg: "Invalid or expired verification code" });
    // }

    
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || admin.isVerified)
      return res.status(400).json({ msg: "admin not found or already verified" });

    const code = generateCode();
    admin.emailCode = code;
    admin.emailCodeExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();

    await sendEmail(email, "New verification code", `Your new code is: ${code}`);
    res.json({ msg: "New verification code sent" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ msg: "Passwords do not match" });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ msg: "admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Incorrect current password" });

    const reused = await Promise.any(
      user.passwordHistory.map(({ password }) => bcrypt.compare(newPassword, password))
    ).catch(() => false);

    if (reused) return res.status(400).json({ msg: "Password reused from history" });

    const hashed = await bcrypt.hash(newPassword, 10);

    admin.password = hashed;
    admin.passwordHistory.push({ password: admin.password, changedAt: new Date() });
    if (admin.passwordHistory.length > 5) admin.passwordHistory.shift();

    await admin.save();
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Email not found" });

    const code = admin.setPasswordResetCode();
    await admin.save({ validateBeforeSave: false });
    await sendEmail(email, "Password Reset Code", `Your reset code is: ${code}`);
    res.json({ msg: "Password reset code sent" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !admin.validateResetCode(code))
      return res.status(400).json({ message: "Invalid/expired Code" });

    const token = jwt.sign(
      { adminId: admin._id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ success: true, token, message: "Code verified" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password_reset")
      return res.status(400).json({ message: "Invalid token" });

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) return res.status(404).json({ message: "User not found" });

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.emailCode = undefined;
    admin.emailCodeExpires = undefined;
    await admin.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(400).json({ message: "Token expired" });
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminUser = async (req, res) => {
  try {
    const admin = await Admin.find({ role: "admin" });
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyCac = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.employerId);
    if (!employer) return res.status(404).json({ error: "Employer not found" });

    employer.cacStatus = "approved"; // ✅ Mark CAC as approved
    employer.cacVerified = true;     // (Optional, if you're still using this flag)
    employer.cacRejectionReason = ""; // Clear any past rejection reason

    await employer.save();

    res.json({ message: "CAC verified successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


// Get all users (for admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Promote or demote user
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// Get overall platform stats
export const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const carCount = await Car.countDocuments();
    const auctionCount = await Auction.countDocuments();
    res.json({ userCount, carCount, auctionCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};



// ✅ Approve User
export const approveUserDocument = async (req, res) => {
  try {
    const { userId } = req.params; // Admin specifies user to approve

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.identityDocuments.status = "approved";
    user.identityDocuments.reviewedAt = new Date();
    user.isApproved = true;
    user.onboardingStage = "completed";

    await user.save();

    res.status(200).json({
      message: "User approved successfully",
      step: user.onboardingStage,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ Reject User
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params; // Admin specifies user to reject
    const { reason } = req.body; // Optional reason for rejection

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.identityDocuments.status = "rejected";
    user.identityDocuments.reviewedAt = new Date();
    user.isApproved = false;
    user.onboardingStage = "rejected";

    if (reason) {
      user.identityDocuments.rejectionReason = reason; // ✅ store reason if given
    }

    await user.save();

    res.status(200).json({
      message: "User rejected successfully",
      step: user.onboardingStage,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPendingDealers = async (req, res) => {
    const users = await User.find({ accountType: 'car_dealer', 'document.status': 'pending' });
    res.json(users);
  };
  
// GET /api/admin/dealers/:id/documents
const getDealerDocuments = async (req, res) => {
  try {
    const dealer = await User.findById(req.params.id);

    if (!dealer || dealer.accountType !== "car_dealer") {
      return res.status(404).json({ error: "Car dealer not found" });
    }

    res.status(200).json({ documents: dealer.documents || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

export const verifyDocument = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    const user = await User.findById(userId);

    if (!user || user.accountType !== "car_dealer") {
      return res.status(400).json({ error: "Invalid user or account type" });
    }

    if (!user.identityDocuments || Object.keys(user.identityDocuments).length === 0) {
      return res.status(400).json({ error: "User has not uploaded a document" });
    }

    if (action === "approve") {
      user.identityDocuments.status = "approved";
      user.isApproved = true; // Dealer fully approved
      user.identityDocuments.reviewedAt = new Date();
    } else if (action === "reject") {
      user.identityDocuments.status = "rejected";
      user.isApproved = false; // Keep them unapproved
      user.identityDocuments.reviewedAt = new Date();
    } else {
      return res.status(400).json({ error: "Invalid action. Use approve or reject" });
    }

    await user.save();

    res.json({
      message: `Document ${action}d successfully`,
      identityDocuments: user.identityDocuments,
      isApproved: user.isApproved
    });
  } catch (err) {
    console.error("Error in verifyDocument:", err);
    res.status(500).json({ error: err.message });
  }
};
