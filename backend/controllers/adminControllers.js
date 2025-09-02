// @ts-nocheck
import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import generateCode from "../utils/generateCode.js";
import sendEmail from "../utils/sendEmails.js";
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

    const token = generateTokenAndSetCookie(admin._id, res, "admin");

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

    const token = generateTokenAndSetCookie(admin._id, res, "admin");
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

// export const verifyCac = async (req, res) => {
//   try {
//     const employer = await Employer.findById(req.params.employerId);
//     if (!employer) return res.status(404).json({ error: "Employer not found" });

//     employer.cacStatus = "approved";
//     employer.cacVerified = true;
//     employer.cacRejectionReason = "";

//     await employer.save();
//     res.json({ message: "CAC verified successfully." });
//   } catch (err) {
//     console.error("verifyCac error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };


// export const rejectCac = async (req, res) => {
//   try {
//     const { reason } = req.body; // rejection reason from admin
//     const employer = await Employer.findById(req.params.employerId);

//     if (!employer) {
//       return res.status(404).json({ error: "Employer not found" });
//     }

//     employer.cacStatus = "rejected";
//     employer.cacVerified = false;
//     employer.cacRejectionReason = reason || "No reason provided";

//     await employer.save();

//     res.status(200).json({
//       message: "CAC rejected successfully",
//       employer,
//     });
//   } catch (err) {
//     console.error("rejectCac error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// ✅ Approve User
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params; // Get the target user's ID from the route param

    // 🔑 Find the user that admin wants to approve
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Approve user
    user.identityDocuments.status = "approved";
    user.identityDocuments.reviewedAt = new Date();
    user.identityDocuments.rejectionReason = null; // clear old rejection reason
    user.isApproved = true;
    user.onboardingStage = "completed";

    await user.save();

    res.json({
      message: "User approved successfully ✅",
      step: user.onboardingStage,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params; // ✅ Get the target user from route params
    const { rejectionReason } = req.body; // Admin provides a reason

    // 🔑 Find the user that admin wants to reject
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Reject user
    user.identityDocuments.status = "rejected";
    user.identityDocuments.reviewedAt = new Date();
    user.identityDocuments.rejectionReason =
      rejectionReason || "Documents not valid";
    user.isApproved = false;
    user.onboardingStage = "rejected"; // mark stage as rejected

    await user.save();

    res.json({
      message: "User rejected ❌",
      reason: user.identityDocuments.rejectionReason,
      step: user.onboardingStage,
      user,
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



export const createVehicle = async (req, res) => {
  // Immediately set response timeout and headers for large requests
  req.setTimeout(300000); // 5 minutes timeout
  res.setHeader('X-Request-Timeout', '300000');

  try {
    // Check if request is too large before processing
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 50 * 1024 * 1024) { // 50MB limit
      return res.status(413).json({
        success: false,
        message: "Request payload too large. Maximum size is 50MB."
      });
    }

    // Process multipart form data as stream
    if (req.is('multipart/form-data')) {
      await processMultipartStream(req, res);
    } else {
      // Handle JSON-only requests
      await processJsonBody(req, res);
    }
  } catch (error) {
    console.error("❌ Error creating vehicle:", error);
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({
        success: false,
        message: "Request timeout - file upload took too long"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Stream-based multipart form data processing
const processMultipartStream = async (req, res) => {
  return new Promise(async (resolve, reject) => {
    let formData = {
      fields: {},
      files: {}
    };

    // Simulate multipart parsing with streams
    let currentField = '';
    let buffer = '';

    req.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // Simple multipart parsing (in real scenario, use busboy or similar)
      const boundary = '--' + req.headers['content-type'].split('boundary=')[1];
      const parts = buffer.split(boundary);
      
      buffer = parts.pop() || ''; // Keep incomplete part in buffer
      
      for (const part of parts) {
        if (part.includes('filename=')) {
          // File part - handle with stream
          processFilePart(part, formData);
        } else {
          // Field part
          processFieldPart(part, formData);
        }
      }
    });

    req.on('end', async () => {
      try {
        // Process remaining buffer
        if (buffer.trim() && !buffer.includes('--')) {
          processFieldPart(buffer, formData);
        }

        // Validate required fields
        const validationError = validateVehicleFields(formData.fields);
        if (validationError) {
          return reject(validationError);
        }

        // Create vehicle with stream-processed data
        const vehicle = await createVehicleFromStreamData(formData);
        
        res.status(201).json({
          success: true,
          message: "✅ Vehicle created successfully",
          vehicle,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
};

const processFilePart = (part, formData) => {
  const headersEnd = part.indexOf('\r\n\r\n');
  if (headersEnd === -1) return;

  const headers = part.substring(0, headersEnd);
  const content = part.substring(headersEnd + 4);
  
  const nameMatch = headers.match(/name="([^"]+)"/);
  const filenameMatch = headers.match(/filename="([^"]+)"/);
  
  if (nameMatch && filenameMatch) {
    const fieldName = nameMatch[1];
    const filename = filenameMatch[1];
    const fileId = uuidv4();
    const filePath = path.join('uploads', `${fileId}-${filename}`);
    
    // Write file stream
    const writeStream = createWriteStream(filePath);
    writeStream.write(content);
    writeStream.end();
    
    if (!formData.files[fieldName]) {
      formData.files[fieldName] = [];
    }
    formData.files[fieldName].push({
      filename,
      path: filePath,
      size: content.length
    });
  }
};

const processFieldPart = (part, formData) => {
  const headersEnd = part.indexOf('\r\n\r\n');
  if (headersEnd === -1) return;

  const headers = part.substring(0, headersEnd);
  const content = part.substring(headersEnd + 4).trim();
  
  const nameMatch = headers.match(/name="([^"]+)"/);
  if (nameMatch) {
    formData.fields[nameMatch[1]] = content;
  }
};

const validateVehicleFields = (fields) => {
  const { make, model, year, vin, price } = fields;
  
  if (!make || !model || !year || !vin || !price) {
    return new Error("Make, model, year, VIN, and price are required");
  }
  
  return null;
};

const createVehicleFromStreamData = async (formData) => {
  const { fields, files } = formData;
  
  let mainImage = "";
  let supportingImages = [];

  if (files?.mainImage?.[0]) {
    mainImage = files.mainImage[0].path;
  }
  if (files?.supportingImages?.length > 0) {
    supportingImages = files.supportingImages.map(f => f.path);
  }

  return await Vehicle.create({
    make: fields.make,
    model: fields.model,
    year: parseInt(fields.year),
    vin: fields.vin,
    bodyType: fields.bodyType,
    fuelType: fields.fuelType,
    transmission: fields.transmission,
    price: parseFloat(fields.price),
    mileage: fields.mileage ? parseInt(fields.mileage) : 0,
    color: fields.color,
    condition: fields.condition,
    lotNumber: fields.lotNumber,
    description: fields.description,
    features: fields.features
      ? Array.isArray(fields.features)
        ? fields.features
        : fields.features.split(",").map(f => f.trim())
      : [],
    mainImage,
    supportingImages,
    zipCode: fields.zipCode,
    address: fields.address,
    state: fields.state,
    city: fields.city,
  });
};



export const createVehicleWithBusboy = (req, res) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10 // Max 10 files
      }
    });

    const formData = {
      fields: {},
      files: {}
    };

    bb.on('field', (name, value) => {
      formData.fields[name] = value;
    });

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const fileId = uuidv4();
      const filePath = path.join('uploads', `${fileId}-${filename}`);
      
      if (!formData.files[name]) {
        formData.files[name] = [];
      }

      const fileData = {
        filename,
        path: filePath,
        size: 0
      };

      const writeStream = createWriteStream(filePath);
      
      file.on('data', (chunk) => {
        fileData.size += chunk.length;
      });

      file.pipe(writeStream);
      
      file.on('end', () => {
        formData.files[name].push(fileData);
      });
    });

    bb.on('finish', async () => {
      try {
        const validationError = validateVehicleFields(formData.fields);
        if (validationError) {
          return reject(validationError);
        }

        const vehicle = await createVehicleFromStreamData(formData);
        
        res.status(201).json({
          success: true,
          message: "✅ Vehicle created successfully",
          vehicle,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    bb.on('error', reject);
    
    req.pipe(bb);
  });
};

