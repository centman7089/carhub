// @ts-nocheck
import Employer from "../models/employerModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import generateCode from "../utils/generateCode.js";
import sendEmail from "../utils/sendEmails.js";

const getEmployerProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let employee;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			employee = await Employer.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is email
			employee = await employee.Employerr({ email: query }).select("-password").select("-updatedAt");
		}

		if (!employee) return res.status(404).json({ error: "Employer not found" });

		res.status(200).json(employee);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getEmployerProfile: ", err.message);
	}
};

const register = async ( req, res ) =>
{
	try {
		const {companyName, email,password,logo, description } = req.body;
		const userExists = await Employer.findOne({ email });
		  if (!companyName || !email) {
			return res.status(404).json({message: "Company Name and Email are required"});
		  }
	

		if (userExists) {
			return res.status(400).json({ error: "User already exists" });
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const code = generateCode();

		const user = await Employer.create({
			companyName,
			email,
			password: hashedPassword,
			logo,
			description,
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
				companyName: user.companyName,
				email: user.email,
				logo: user.logo,
				description: user.description,
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
		const user = await Employer.findOne( { email} );
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



const updateUser = async (req, res) => {
	const { companyName,email, description} = req.body;
	let { logo } = req.body;

	const userId = req.user._id;
	try {
		let user = await Employer.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		// if (req.params.id !== userId.toString())
		// 	return res.status(400).json({ error: "You cannot update other user's profile" });

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
		user.logo = logo || user.logo;
		user.description = description || user.description;
		

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
const forgotPassword = async (req, res) => {
	try {
	  const { email } = req.body;
	  const user = await Employer.findOne({ email });
  
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
	  const user = await Employer.findOne({ email });
  
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
  
  // Change Password (Requires token)
  const changePassword = async (req, res) => {
	try {
	  const userId = req.user._id;
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

  const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

export
{
	getEmployerProfile,
	register,
	login,
	logoutUser,
	updateUser,
	verifyEmail,
	resendCode,
	forgotPassword,
	resetPassword,
	changePassword
};
