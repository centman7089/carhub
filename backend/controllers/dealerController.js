// @ts-nocheck

import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import generateCode from "../utils/generateCode.js";
// import {sendEmail} from "../utils/sendEmails.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApprovalEmail,
  sendRejectionEmail,
} from "../utils/sendEmails.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Dealer from "../models/dealerModel.js";

// In-memory session store (use Redis in production)
const resetSessions = new Map();

// Generate session token
const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================
// GET USER PROFILE
// =============================
const getDealerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid dealerId" });
    }

    const dealer = await Dealer.findById(id).select(
      "-password -passwordHistory -resetCode -resetCodeExpires -emailCode -emailCodeExpires -__v"
    );

    if (!dealer) return res.status(404).json({ error: "Dealer not found" });

    // Response with defaults
    const dealerResponse = {
      _id: dealer._id,
      firstName: dealer.firstName || "",
      lastName: dealer.lastName || "",
      username: dealer.username || "",
      email: dealer.email || "",
      phone: dealer.phone || "",
      profilePic: dealer.profilePic || "",
      country: dealer.country || "",
      state: dealer.state || "",
      city: dealer.city || "",
      streetAddress: dealer.streetAddress || "",
      zipCode: dealer.zipCode || "",
      isVerified: dealer.isVerified || false,
      isApproved: dealer.isApproved || false,
      identityDocuments: {
        idCardFront: dealer.identityDocuments?.idCardFront || "",
        driverLicense: dealer.identityDocuments?.driverLicense || "",
        cac: dealer.identityDocuments?.cac || "",
        status: dealer.identityDocuments?.status || "",
        rejectionReason: dealer.identityDocuments?.rejectionReason || "",
        reviewedAt: dealer.identityDocuments?.reviewedAt || "",
      },
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
    };

    res.status(200).json({
      message: "Dealer profile fetched successfully",
      dealer: dealerResponse,
    });
  } catch (err) {
    console.error("Error in getDealerProfile:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// =============================
// REGISTER
// =============================
const register = async (req, res) => {
    try {
        const {
            firstName,lastName,email,password,phone,state,city,streetAddress,zipCode,dateOfBirth
        } = req.body;

        // Validate required fields
        if (
            !firstName || !lastName || !email || !password || !phone || !state || !city || !streetAddress || !dateOfBirth
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

       

        // Check if dealer already exists
        const userExists = await Dealer.findOne({ email });
        if (userExists) return res.status(400).json({ error: "Dealer already exists" });

        // Generate email verification code
        const code = generateCode();

        // Create dealer (default role = "dealer")
        const dealer = new Dealer({firstName,lastName,email,password,phone,state,city,streetAddress,zipCode,dateOfBirth, emailCode: code, emailCodeExpires: Date.now() + 10 * 60 * 1000, passwordHistory: [{ password, changedAt: new Date() }], isVerified: false,
            // isApproved: false,
            onboardingCompleted: false,
        });

        await dealer.save();

           // ✅ Use branded template
    await sendVerificationEmail(email, code);

    generateTokenAndSetCookie(dealer._id, res, "dealerId");

        res.status(201).json({
            _id: dealer._id,
            firstName: dealer.firstName,
            lastName: dealer.lastName,
            email: dealer.email,
            phone: dealer.phone,
            state: dealer.state,
            city: dealer.city,
            address: dealer.address,
            // role: dealer.role,
            msg: "User registered. Verification code sent to email."
        });
    } catch (err) {
        console.error("Error in register:", err);
        res.status(500).json({ error: err.message });
    }
};


// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const dealer = await Dealer.findOne({ email });
//     if (!dealer) return res.status(400).json({ msg: "Invalid credentials" });

//     const isPasswordCorrect = await dealer.correctPassword(password);
//     if (!isPasswordCorrect) {
//       return res.status(400).json({ error: "Invalid password" });
//     }

//     if (!dealer.isVerified) {
//       const code = generateCode();
//       dealer.emailCode = code;
//       dealer.emailCodeExpires = Date.now() + 10 * 60 * 1000;
//       await dealer.save();

//       await sendVerificationEmail(email, code);

//       return res.status(403).json({
//         msg: "Account not verified. A new verification code has been sent.",
//         isVerified: false,
//       });
//     }

//     // if (dealer) {
//       if (!dealer.isApproved || dealer.identityDocuments.status !== "approved") {
//         return res.status( 403 ).json( {
//           msg: "Awaiting admin approval",
//           isVerified: true,
//           isApproved: false,
//           documentStatus: dealer.identityDocuments?.status || "pending",
//         });
//       }
//     // }

//     if (
//       dealer.identityDocuments?.status === "approved" &&
//       dealer.onboardingStage !== "completed"
//     ) {
//       dealer.onboardingStage = "completed";
//       dealer.onboardingCompleted = true;
//     }

//     // ✅ Update last login + status
//     dealer.lastLogin = new Date();
//     dealer.loginStatus = "Active";

//     await dealer.save(); // <-- you forgot this ✅

//     const token = generateTokenAndSetCookie(dealer._id, res, "dealerId");

//     res.status(200).json({
//       token,
//       _id: dealer._id,
//       email: dealer.email,
//       msg: "Login Successful",
//       isVerified: true,
//       role: dealer.role,
//       lastLogin: dealer.lastLogin,
//       loginStatus: dealer.loginStatus, // will now be "Active"
//       isApproved: dealer.isApproved,
//       documentStatus: dealer.identityDocuments?.status,
//       onboardingCompleted: dealer.onboardingCompleted,
//     });
//   } catch (err) {
//     console.error("Error in login:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// };

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const dealer = await Dealer.findOne({ email });
    if (!dealer) return res.status(400).json({ msg: "Invalid credentials" });

    const isPasswordCorrect = await dealer.correctPassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // always update login details
    dealer.lastLogin = new Date();
    dealer.loginStatus = "Active";

    // onboarding completion check
    if (
      dealer.identityDocuments?.status === "approved" &&
      dealer.onboardingStage !== "completed"
    ) {
      dealer.onboardingStage = "completed";
      dealer.onboardingCompleted = true;
    }

    await dealer.save();

    // ✅ generate token first (before any return)
    const token = generateTokenAndSetCookie(dealer._id, res, "dealerId");

    // not verified → send new code but still return token
    if (!dealer.isVerified) {
      const code = generateCode();
      dealer.emailCode = code;
      dealer.emailCodeExpires = Date.now() + 10 * 60 * 1000;
      await dealer.save();

      await sendVerificationEmail(email, code);

      return res.status(403).json({
        msg: "Account not verified. A new verification code has been sent.",
        isVerified: false,
        token, // still return token
      });
    }

    // not yet approved
    if (!dealer.isApproved || dealer.identityDocuments.status !== "approved") {
      return res.status(403).json({
        msg: "Awaiting admin approval",
        isVerified: true,
        isApproved: false,
        documentStatus: dealer.identityDocuments?.status || "pending",
        token, // still return token
      });
    }

    // fully approved
    return res.status(200).json({
      token,
      _id: dealer._id,
      email: dealer.email,
      msg: "Login Successful",
      isVerified: true,
      role: dealer.role,
      lastLogin: dealer.lastLogin,
      loginStatus: dealer.loginStatus,
      isApproved: dealer.isApproved,
      documentStatus: dealer.identityDocuments?.status,
      onboardingCompleted: dealer.onboardingCompleted,
    });
  } catch (err) {
    console.error("Error in login:", err.message);
    res.status(500).json({ error: err.message });
  }
};



// =============================
// LOGOUT
// =============================
// const logoutUser = (req, res) => {
// 	try {
// 		res.cookie("jwt", "", { maxAge: 1 });
// 		res.status(200).json({ message: "User logged out successfully" });
// 	} catch (err) {
// 		console.error("Error in logoutUser:", err.message);
// 		res.status(500).json({ error: err.message });
// 	}
// };
const logoutUser = async (req, res) => {
  try {
    const dealerId = req.dealer.id; // assuming you attach dealer from token middleware
    await Dealer.findByIdAndUpdate(dealerId, { loginStatus: "Inactive" });

    res.clearCookie("dealerId"); // remove token cookie
    res.status(200).json({ msg: "Logged out successfully", loginStatus: "Inactive" });
  } catch (err) {
    console.error("Error in logout dealer:", err.message);
    res.status(500).json({ error: err.message });
  }
};


// =============================
// VERIFY EMAIL
// =============================
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const dealer = await Dealer.findOne({ email });
        if (!dealer || dealer.isVerified) return res.status(400).json({ msg: "Invalid request" });
        if (dealer.emailCode !== code || Date.now() > dealer.emailCodeExpires) {
            return res.status(400).json({ msg: "Code expired or incorrect" });
        }
        dealer.isVerified = true;
        dealer.emailCode = null;
        dealer.emailCodeExpires = null;
        await dealer.save();
        res.json({ msg: "Email verified successfully" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

const updateDealer = async (req, res) => {
  const { firstName, lastName, email, phone, country, state, city, streetAddress, zipCode } = req.body;
  const dealerId = req.dealer._id; // from auth middleware

  try {
    // Ensure user exists
    let dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json({ error: "dealer not found" });

    // Ensure logged-in dealer is updating their own profile
    if (req.params.id !== dealerId.toString()) {
      return res.status(403).json({ error: "You cannot update another dealer's profile" });
    }

    // Update fields → default to empty string if not provided
    dealer.firstName = firstName !== undefined ? firstName : "";
    dealer.lastName = lastName !== undefined ? lastName : "";
    dealer.email = email !== undefined ? email : "";
    dealer.phone = phone !== undefined ? phone : "";
    dealer.country = country !== undefined ? country : "";
    dealer.state = state !== undefined ? state : "";
    dealer.city = city !== undefined ? city : "";
    dealer.streetAddress = streetAddress !== undefined ? streetAddress : "";
    dealer.zipCode = zipCode !== undefined ? zipCode : "";

    // Save updated dealer
    await dealer.save();

    // Exclude sensitive fields from response
    const dealerResponse = dealer.toObject();
    delete dealerResponse.password;
    delete dealerResponse.passwordHistory;
    delete dealerResponse.resetCode;
    delete dealerResponse.resetCodeExpires;
    delete dealerResponse.emailCode;
    delete dealerResponse.emailCodeExpires;

    res.status(200).json({
      message: "Profile updated successfully",
      dealer: dealerResponse,
    });
  } catch (err) {
    console.error("Error in updating Dealer:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

const verifyPasswordResetCode = async (req, res) => {
    try {
      const { email, code } = req.body;
      const dealer = await Dealer.findOne({ email });
  
    //   if (!user || user.isVerified) return res.status(400).json({ msg: "Invalid request" });
  
      if (dealer.resetCode !== code || Date.now() > dealer.reseCodeExpires)
        return res.status(400).json({ msg: "Code expired or incorrect" });
  
      dealer.isVerified = true;
      dealer.resetCode = null;
      dealer.resetCodeExpires = null;
      await dealer.save();
  
      res.json({ msg: "code verified successfully" });
    } catch (err) {
      res.status(500).json({ msg: err.msg });
    }
  };
  
  // Resend Verification Code
 // RESEND VERIFICATION CODE
// =============================
const resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    const dealer = await Dealer.findOne({ email });

    if (!dealer || dealer.isVerified) {
      return res.status(400).json({ msg: "dealer not found or already verified" });
    }

    const code = generateCode();
    dealer.emailCode = code;
    dealer.emailCodeExpires = Date.now() + 10 * 60 * 1000;
    await dealer.save();

    // ✅ Branded resend
    await sendVerificationEmail(email, code);

    res.json({ msg: "New verification code sent" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
  

  // Change Password (Requires token)
const changePassword = async (req, res) => {
  try {
    const dealerId = req.dealer._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    // Verify current password
    if (!(await dealer.correctPassword(currentPassword))) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    // // Prevent reuse
    // const reused = await Promise.any(
    //   dealer.passwordHistory.map(({ password }) =>
    //     bcrypt.compare(newPassword, password)
    //   )
    // ).catch(() => false);

    // if (reused) {
    //   return res.status(400).json({ msg: "Password reused from history" });
    // }

    // Prevent reuse (check against history)
        for (let entry of dealer.passwordHistory) {
          const reused = await bcrypt.compare(newPassword, entry.password);
          if (reused) {
            return res.status(400).json({ msg: "Password reused from history" });
          }
        }
        
     dealer.password = newPassword;

    // Push new password hash to history
    dealer.passwordHistory.push({ password: dealer.password, changedAt: new Date() });
    if (dealer.passwordHistory.length > 5) dealer.passwordHistory.shift();

    await dealer.save();

    // Save new password
    // dealer.password = newPassword;
    // dealer.passwordHistory.push({ password: dealer.password, changedAt: new Date() });
    // if (dealer.passwordHistory.length > 5) dealer.passwordHistory.shift();

    // await dealer.save();
    


    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// FORGOT PASSWORD
// =============================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const dealer = await Dealer.findOne({ email });

    if (!dealer) return res.status(400).json({ msg: "Email not found" });

    const code = dealer.setPasswordResetCode();
    await dealer.save({ validateBeforeSave: false });

    // ✅ Branded reset email
    await sendPasswordResetEmail(email, code);

    res.json({ msg: "Password reset code sent" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
  

  const verifyResetCode = async (req, res) => {
    try {
      const { email, code} = req.body;
      const dealer = await Dealer.findOne({ email });
  
      if (!dealer || !dealer.validateResetCode(code)) {
        return res.status(400).json({ message: "Invalid/expired OTP" });
      }
  
      // Generate short-lived JWT (15 mins expiry)
      const token = jwt.sign(
        { dealerId: dealer._id, purpose: "password_reset" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid token" });
    }

    const dealer = await Dealer.findById(decoded.dealerId);
    if (!dealer) return res.status(404).json({ message: "Dealer not found" });

       // Prevent reuse (same logic as changePassword)
        for (let entry of dealer.passwordHistory) {
          const reused = await bcrypt.compare(newPassword, entry.password);
          if (reused) {
            return res.status(400).json({ msg: "Password reused from history" });
          }
        }
    
        dealer.password = newPassword;
    
        // Add to password history
        dealer.passwordHistory.push({ password: dealer.password, changedAt: new Date() });
        if (dealer.passwordHistory.length > 5) dealer.passwordHistory.shift();
    
        // Clear reset codes
        dealer.resetCode = undefined;
        dealer.resetCodeExpires = undefined;
        await dealer.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Server error" });
  }
};


const uploadDocuments = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) return res.status(404).json({ error: "Dealer not found" });

    // Define required + optional fields
    const requiredFields = ["idCardFront", "driverLicense"];
    const optionalFields = ["cac"];

    let uploadedCount = 0;

    // Save required documents
    requiredFields.forEach((field) => {
      if (req.files[field] && req.files[field][0]) {
        dealer.identityDocuments[field] = req.files[field][0].path; // Cloudinary URL
        uploadedCount++;
      }
    });

    // Save optional documents (if provided)
    optionalFields.forEach((field) => {
      if (req.files[field] && req.files[field][0]) {
        dealer.identityDocuments[field] = req.files[field][0].path; // Cloudinary URL
      }
    });

    // Check if all required docs uploaded
    const missingDocs = requiredFields.filter((field) => !dealer.identityDocuments[field]);
    if (missingDocs.length > 0) {
      return res.status(400).json({
        error: `Missing required documents: ${missingDocs.join(", ")}`,
      });
    }

    // ✅ Reset if previously rejected
    dealer.resetDocumentsIfRejected();

    // ✅ Mark as pending for admin review
    dealer.identityDocuments.status = "pending";
    dealer.identityDocuments.uploadedAt = new Date();
    dealer.onboardingStage = "terms";

    await dealer.save();

    res.json({
      message: "All required documents uploaded successfully. Proceed to Terms & Conditions.",
      step: dealer.onboardingStage,
      documents: dealer.identityDocuments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const acceptTerms = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { acceptedTerms, acceptedPrivacy } = req.body;

    // ✅ Only allow the logged-in dealer to accept their own terms
    if (req.dealer._id.toString() !== dealerId) {
      return res.status(403).json({ error: "Unauthorized action" });
    }

    // 🔎 Find dealer
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json({ error: "Dealer not found" });

    // ✅ Both must be accepted
    if (!acceptedTerms || !acceptedPrivacy) {
      return res.status(400).json({
        error: "You must accept both Terms and Privacy Policy",
      });
    }

    // ✅ Check required docs
    const { idCardFront, driverLicense } =
      dealer.identityDocuments;

    if (!idCardFront || !driverLicense) {
      return res.status(400).json({
        error:
          "You must upload all required documents (ID card, Driver License) before accepting terms.",
      });
    }

    // ✅ Update terms & stage
    dealer.acceptedTerms = true;
    dealer.acceptedPrivacy = true;
    dealer.onboardingStage = "admin_review";
    await dealer.save();

    // ✅ Safe response (no password / history / reset codes)
    const safeUser = {
      _id: dealer._id,
      firstName: dealer.firstName,
      lastName: dealer.lastName,
      email: dealer.email,
      role: dealer.role,
      onboardingStage: dealer.onboardingStage,
      acceptedTerms: dealer.acceptedTerms,
      acceptedPrivacy: dealer.acceptedPrivacy,
      identityDocuments: {
        status: dealer.identityDocuments.status,
        reviewedAt: dealer.identityDocuments.reviewedAt,
      },
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
    };

    res.json({
      message:
        "Terms and privacy accepted successfully ✅. Awaiting Admin Approval",
      step: dealer.onboardingStage,
      dealer: safeUser,
    });
  } catch (err) {
    console.error("acceptTerms error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


const updateProfilePhoto = async (req, res) => {
  try {
    const { dealerId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No profile photo uploaded!" });
    }

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json({ message: "Dealer not found" });

    // Save Cloudinary URL to dealer
    dealer.profilePic = req.file.path;
    await dealer.save();

    res.status(200).json({
      message: "Profile photo updated successfully",
      profilePic: dealer.profilePic,
    });
  } catch (error) {
    console.error("Error updating dealer profile photo:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * Get the profile of the currently logged-in dealer
 * Uses req.dealer._id from auth middleware.
 */
const getMyProfile = async (req, res) => {
  try {
    const dealerId = req.dealer._id;

    const dealer = await Dealer.findById(dealerId).select(
      "-password -passwordHistory -resetCode -resetCodeExpires -emailCode -emailCodeExpires -__v"
    );

    if (!dealer) return res.status(404).json({ error: "Dealer not found" });

    const dealerResponse = {
      _id: dealer._id,
      firstName: dealer.firstName || "",
      lastName: dealer.lastName || "",
      username: dealer.username || "",
      email: dealer.email || "",
      phone: dealer.phone || "",
      profilePic: dealer.profilePic || "",
      country: dealer.country || "",
      state: dealer.state || "",
      city: dealer.city || "",
      streetAddress: dealer.streetAddress || "",
      zipCode: dealer.zipCode || "",
      isVerified: dealer.isVerified || false,
      isApproved: dealer.isApproved || false,
      identityDocuments: dealer.identityDocuments || {},
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
    };

    res.status(200).json({
      message: "My profile fetched successfully",
      dealer: dealerResponse,
    });
  } catch (err) {
    console.error("Error in Dealer getMyProfile:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

const getDealerById = async (req, res) => {
  try {
    const { dealerId } = req.params;

    const dealer = await Dealer.findById(dealerId).select(
      "-password -passwordHistory -resetCode -resetCodeExpires -emailCode -emailCodeExpires -__v"
    );

    if (!dealer) {
      return res.status(404).json({ error: "Dealer not found" });
    }

    // ✅ If token expired or dealer logged out manually
    if (!req.dealer || req.dealer._id.toString() !== dealerId) {
      // mark as Inactive
      if (dealer.loginStatus !== "Inactive") {
        dealer.loginStatus = "Inactive";
        await dealer.save();
      }
    }

    // Compute status
    let status = "Inactive";
    if (dealer.isApproved) status = "Active";
    else if (!dealer.isApproved && dealer.identityDocuments?.status === "pending") {
      status = "Pending";
    }

    // Example stats (optional)
    const stats = {
      totalBids: dealer.totalBids || 0,
      wonAuctions: dealer.wonAuctions || 0,
      creditLimit: dealer.creditLimit || 0,
      lastLogin: dealer.lastLogin || null,
    };

    // Format response
    const dealerDetails = {
      _id: dealer._id,
      dealerId: `#USR${String(dealer._id).slice(-4).toUpperCase()}`,
      firstName: dealer.firstName || "",
      lastName: dealer.lastName || "",
      fullName: `${dealer.firstName || ""} ${dealer.lastName || ""}`.trim(),
      username: dealer.username || "",
      email: dealer.email || "",
      phone: dealer.phone || "",
      dateOfBirth: dealer.dateOfBirth || "",
      profilePic: dealer.profilePic || "",
      role: dealer.role || "",
      status,
      loginStatus: dealer.loginStatus, // ✅ always up to date
      isVerified: dealer.isVerified || false,
      isApproved: dealer.isApproved || false,
      address: {
        country: dealer.country || "",
        state: dealer.state || "",
        city: dealer.city || "",
        streetAddress: dealer.streetAddress || "",
        zipCode: dealer.zipCode || "",
      },
      accountDetails: stats,
      identityDocuments: {
        idCardFront: dealer.identityDocuments?.idCardFront || "",
        driverLicense: dealer.identityDocuments?.driverLicense || "",
        cac: dealer.identityDocuments?.cac || "",
        proofOfAddress: dealer.identityDocuments?.proofOfAddress || "",
        status: dealer.identityDocuments?.status || "",
        rejectionReason: dealer.identityDocuments?.rejectionReason || "",
        reviewedAt: dealer.identityDocuments?.reviewedAt || "",
      },
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
    };

    res.status(200).json({
      message: "Dealer details fetched successfully",
      dealer: dealerDetails,
    });
  } catch (err) {
    console.error("Error in getDealerById:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};





export {
    register,
    login,
    logoutUser,
    updateDealer,
    getDealerProfile,
    getMyProfile,
    verifyEmail,
    resendCode,
    verifyResetCode,
    forgotPassword,
    resetPassword,
    changePassword,
    acceptTerms,
    uploadDocuments,
    updateProfilePhoto,
    getDealerById
  // approveUser
};
