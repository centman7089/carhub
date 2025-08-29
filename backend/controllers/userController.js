// @ts-nocheck
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import generateCode from "../utils/generateCode.js";
import sendEmail from "../utils/sendEmails.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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
const getUserProfile = async (req, res) => {
	const { query } = req.params;
	try {
		let user;
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findById(query).select("-password -updatedAt");
		} else {
			user = await User.findOne({ username: query }).select("-password -updatedAt");
		}
		if (!user) return res.status(404).json({ error: "User not found" });
		res.status(200).json(user);
	} catch (err) {
		console.error("Error in getUserProfile:", err.message);
		res.status(500).json({ error: err.message });
	}
};

// =============================
// REGISTER
// =============================
const register = async (req, res) => {
	try {
		const {
			firstName,
			lastName,
			email,
			password,
			phone,
			state,
			city,
			streetAddress,
			zipCode,
			dateOfBirth
		} = req.body;

		// Validate required fields
		if (
			!firstName || !lastName || !email || !password || !phone || !state || !city || !streetAddress || !dateOfBirth
		) {
			return res.status(400).json({ message: "All fields are required" });
		}

		// if (!acceptedTerms || !acceptedPrivacy) {
		// 	return res.status(400).json({ message: "You must accept the Terms & Conditions and Privacy Policy" });
		// }

		// Check if user already exists
		const userExists = await User.findOne({ email });
		if (userExists) return res.status(400).json({ error: "User already exists" });

		// Generate email verification code
		const code = generateCode();

		// Create user (default role = "user")
		const newUser = new User({
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
			role: "user", // default role
			// acceptedTerms,
			// acceptedPrivacy,
			emailCode: code,
			emailCodeExpires: Date.now() + 10 * 60 * 1000,
			passwordHistory: [{ password, changedAt: new Date() }],
			isVerified: false,
			// isApproved: false,
			onboardingCompleted: false,
		});

		await newUser.save();

		// Send verification email
		await sendEmail(email, "Verify your email", `Your verification code is: ${code}`);
		generateTokenAndSetCookie(newUser._id, res);

		res.status(201).json({
			_id: newUser._id,
			firstName: newUser.firstName,
			lastName: newUser.lastName,
			email: newUser.email,
      phone: newUser.phone,
      state: user.state,
			city: user.city,
			address: user.address,
			role: newUser.role,
			// acceptedTerms: newUser.acceptedTerms,
			// acceptedPrivacy: newUser.acceptedPrivacy,
			// step: "email_verification",
			msg: "User registered. Verification code sent to email."
		});
	} catch (err) {
		console.error("Error in register:", err);
		res.status(500).json({ error: err.message });
	}
};

// =============================
// LOGIN
// =============================
const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ msg: "Invalid credentials" });

		const isPasswordCorrect = await user.correctPassword(password);
		if (!isPasswordCorrect) return res.status(400).json({ error: "Invalid password" });

		if (!user.isVerified) {
			const code = generateCode();
			user.emailCode = code;
			user.emailCodeExpires = Date.now() + 10 * 60 * 1000;
			await user.save();
			await sendEmail(email, "New Verification Code", `Your new verification code is: ${code}`);
			return res.status(403).json({
				msg: "Account not verified. A new verification code has been sent.",
				isVerified: false
			});
		}

		if (user.role === "car_dealer" && !user.isApproved) {
			return res.status(403).json({ msg: "Awaiting admin approval", isVerified: true, isApproved: false });
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
	} catch (err) {
		console.error("Error in login:", err.message);
		res.status(500).json({ error: err.message });
	}
};

// =============================
// LOGOUT
// =============================
const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		console.error("Error in logoutUser:", err.message);
		res.status(500).json({ error: err.message });
	}
};

// =============================
// VERIFY EMAIL
// =============================
const verifyEmail = async (req, res) => {
	try {
		const { email, code } = req.body;
		const user = await User.findOne({ email });
		if (!user || user.isVerified) return res.status(400).json({ msg: "Invalid request" });
		if (user.emailCode !== code || Date.now() > user.emailCodeExpires) {
			return res.status(400).json({ msg: "Code expired or incorrect" });
		}
		user.isVerified = true;
		user.emailCode = null;
		user.emailCodeExpires = null;
		await user.save();
		res.json({ msg: "Email verified successfully" });
	} catch (err) {
		res.status(500).json({ msg: err.message });
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
  


// =============================
// (rest of functions remain same, except replace `accountType` with `role` check)
// =============================

export {
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
	acceptTerms,
	uploadDocuments
};
