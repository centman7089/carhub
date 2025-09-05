// @ts-nocheck
import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import generateCode from "../utils/generateCode.js";
import { sendEmail, buildEmailTemplate } from "../utils/sendEmails.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Vehicle from "../models/Vehicle.js";
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Alternative: Use busboy for proper multipart streaming
import busboy from 'busboy';


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

// Auth Controllers
// ========================
export const createAdmin = async (req, res) => {
  try {
    const { firstName,
			lastName,
			email,
			password,
			phone,
			state,
			city,
			streetAddress,
			zipCode,
			dateOfBirth, role } = req.body;

   // Validate required fields
		if (
			!firstName || !lastName || !email || !password || !phone || !state || !city || !streetAddress || !dateOfBirth
		) {
			return res.status(400).json({ message: "All fields are required" });
		}

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const code = generateCode();
    const admin = new Admin({
    firstName,
			lastName,
			email,
			password,
			phone,
			state,
			city,
			streetAddress,
			zipCode,
			dateOfBirth,
      role,
      emailCode: code,
      emailCodeExpires: Date.now() + 10 * 60 * 1000, // 10 mins
      passwordHistory: [{ password, changedAt: new Date() }],
      isVerified: false,
    });

    await admin.save();
    await sendEmail(email, "Verify your email", `Your verification code is: ${code}`);

    const token = generateTokenAndSetCookie(admin._id, res, "adminId");

    res.status(201).json({
      token,
      ...formatAdminResponse(admin),
      msg: "Admin registered. Verification code sent to email.",
    });
  } catch (err) {
    console.error("Error registering admin:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.correctPassword(password))) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

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

    const token = generateTokenAndSetCookie(admin._id, res, "adminId");
    res.status(200).json({
      token,
      ...formatAdminResponse(admin),
      msg: "Login successful",
      isVerified: true,
    });
  } catch (error) {
    console.error("Error in loginAdmin:", error.message);
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

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    if (!(await admin.correctPassword(currentPassword))) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    // Prevent reuse
    const reused = await Promise.any(
      admin.passwordHistory.map(({ password }) => admin.correctPassword(newPassword))
    ).catch(() => false);

    if (reused) return res.status(400).json({ msg: "Password reused from history" });

    admin.password = newPassword; // Let pre-save hook hash
    admin.passwordHistory.push({ password: admin.password, changedAt: new Date() });
    if (admin.passwordHistory.length > 5) admin.passwordHistory.shift();

    await admin.save();
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid token" });
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) return res.status(404).json({ message: "User not found" });

    admin.password = newPassword; // Let pre-save hook hash
    admin.emailCode = undefined;
    admin.emailCodeExpires = undefined;
    await admin.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Server error" });
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


export const getAdminUser = async (req, res) => {
  try {
    const admin = await Admin.find({ role: "admin" });
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



// ✅ Approve User
// export const approveUser = async (req, res) => {
//   try {
//     const { userId } = req.params; // Get the target user's ID from the route param

//     // 🔑 Find the user that admin wants to approve
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // ✅ Approve user
//     user.identityDocuments.status = "approved";
//     user.identityDocuments.reviewedAt = new Date();
//     user.identityDocuments.rejectionReason = null; // clear old rejection reason
//     user.isApproved = true;
//     user.onboardingStage = "completed";

//     await user.save();

//     res.json({
//       message: "User approved successfully ✅",
//       step: user.onboardingStage,
//       user,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// export const approveUserDocuments = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // 🔑 Find the user
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // ✅ Check if all required documents are uploaded before approval
//     const { idCardFront, driverLicense, tin, bankStatement } =
//       user.identityDocuments;

//     if (!idCardFront || !driverLicense || !tin || !bankStatement) {
//       return res.status(400).json({
//         error:
//           "Cannot approve user. All required documents must be uploaded before approval.",
//       });
//     }

//     // ✅ Approve user
//     user.identityDocuments.status = "approved";
//     user.identityDocuments.reviewedAt = new Date();
//     user.identityDocuments.rejectionReason = null;
//     user.isApproved = true;
//     user.onboardingStage = "completed";

//     await user.save();

//     res.json({
//       message: "User approved successfully ✅",
//       step: user.onboardingStage,
//       user,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };




// export const rejectUser = async (req, res) => {
//   try {
//     const { userId } = req.params; // ✅ Get the target user from route params
//     const { rejectionReason } = req.body; // Admin provides a reason

//     // 🔑 Find the user that admin wants to reject
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // ✅ Reject user
//     user.identityDocuments.status = "rejected";
//     user.identityDocuments.reviewedAt = new Date();
//     user.identityDocuments.rejectionReason =
//       rejectionReason || "Documents not valid";
//     user.isApproved = false;
//     user.onboardingStage = "rejected"; // mark stage as rejected

//     await user.save();

//     res.json({
//       message: "User rejected ❌",
//       reason: user.identityDocuments.rejectionReason,
//       step: user.onboardingStage,
//       user,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const rejectUserDocuments = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { rejectionReason } = req.body;

//     // 🔑 Find the user
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     if (!rejectionReason) {
//       return res.status(400).json({ error: "Rejection reason is required" });
//     }

//     // ✅ Reject user
//     user.identityDocuments.status = "rejected";
//     user.identityDocuments.reviewedAt = new Date();
//     user.identityDocuments.rejectionReason = rejectionReason;
//     user.isApproved = false;
//     user.onboardingStage = "rejected";

//     await user.save();

//     res.json({
//       message: "User rejected ❌",
//       reason: user.identityDocuments.rejectionReason,
//       step: user.onboardingStage,
//       user,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// @ts-nocheck
import User from "../models/userModel.js";

// ✅ Get all uploaded documents for a specific user
export const getUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "firstName lastName email role identityDocuments onboardingStage isApproved"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User documents retrieved successfully",
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        documents: user.identityDocuments,
        onboardingStage: user.onboardingStage,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Approve user documents
// ✅ Approve user documents
export const approveUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { idCardFront, driverLicense, tin, bankStatement } =
      user.identityDocuments;

    if (!idCardFront || !driverLicense || !tin || !bankStatement) {
      return res.status(400).json({
        error:
          "Cannot approve user. All required documents must be uploaded before approval.",
      });
    }

    user.identityDocuments.status = "approved";
    user.identityDocuments.reviewedAt = new Date();
    user.identityDocuments.rejectionReason = null;
    user.isApproved = true;
    user.onboardingStage = "completed";

    await user.save();

    // ✅ Build HTML template
    const html = buildEmailTemplate(
      "✅ Documents Approved",
      `Hello ${user.firstName},<br><br>
      Good news! Your identity verification documents have been <b>approved</b> 🎉.<br><br>
      You can now access your account with full privileges.`,
      "Go to Dashboard",
      `${process.env.CLIENT_URL}/dashboard`
    );

    await sendEmail(user.email, "✅ Documents Approved", html);

    res.json({
      message: "User Documents approved successfully ✅",
      step: user.onboardingStage,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reject user documents
export const rejectUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    user.identityDocuments.status = "rejected";
    user.identityDocuments.reviewedAt = new Date();
    user.identityDocuments.rejectionReason = rejectionReason;
    user.isApproved = false;
    user.onboardingStage = "documents";

    await user.save();

    // ✅ Build HTML template
    const html = buildEmailTemplate(
      "❌ Documents Rejected",
      `Hello ${user.firstName},<br><br>
      Unfortunately, your identity verification documents were <b>rejected</b> for the following reason:<br><br>
      <i>${rejectionReason}</i><br><br>
      Please re-upload valid documents in your dashboard to continue.`,
      "Re-upload Documents",
      `${process.env.CLIENT_URL}/upload-documents`
    );

    await sendEmail(user.email, "❌ Documents Rejected", html);

    res.json({
      message: "User Documents rejected ❌",
      reason: user.identityDocuments.rejectionReason,
      step: user.onboardingStage,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ List all users with pending documents
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      "identityDocuments.status": "pending",
    }).select("firstName lastName email role identityDocuments createdAt");

    res.json({
      message: "Pending users retrieved successfully",
      count: pendingUsers.length,
      users: pendingUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// =============================
// GET ALL USERS (with filters)
// =============================
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, sort, search } = req.query;

    let filter = {};

    // ✅ Filter by role
    if (role) filter.role = role;

    // ✅ Filter by verification/approval status
    if (status === "active") filter.isVerified = true;
    if (status === "inactive") filter.isVerified = false;
    if (status === "approved") filter.isApproved = true;
    if (status === "pending") filter.isApproved = false;

    // ✅ Search by name or email
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    // ✅ Sorting
    let sortOption = { createdAt: -1 }; // default recent
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const users = await User.find(filter).sort(sortOption);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// =============================
// UPDATE USER ROLE
// =============================
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin", "car_dealer", "retailer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};


