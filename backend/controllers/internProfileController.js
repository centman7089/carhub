// @ts-nocheck

import bcrypt from "bcryptjs";
import CourseSkillMap from "../models/courseSkills.js";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import InternProfile from "../models/internProfile.js";
import User from "../models/userModel.js";


const createIntern = async (req, res) => {
    try {
      const fileData = {
        resume: req.files?.resume?.[0]?.filename || '',
        photo: req.files?.photo?.[0]?.filename || '',
      };
      const user = await User.create({ ...req.body, ...fileData });
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: 'Intern creation failed', error: err.message });
    }
  };
  
  const getInterns = async (req, res) => {
    try {
      const query = {};
      if (req.query.course) query.course = req.query.course;
      if (req.query.skills) query.skills = { $in: req.query.skills.split(',') };
      const user = await User.find(query);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: 'Failed to fetch interns', error: err.message });
    }
};

const getSkillsByCourse = async (req, res) => {
  const { course } = req.query;
  const courseEntry = await CourseSkillMap.findOne({ course });
  res.json(courseEntry ? courseEntry.skills : []);
};

const updateSkills = async (req, res) => {
  const { skills } = req.body;
  await User.findByIdAndUpdate(req.user._id, { skills });
  res.json({ success: true });
};

const updateCourses = async (req, res) => {
  const { course } = req.body;
  await User.findByIdAndUpdate(req.user._id, { course });
  res.json({ success: true });
};

const addCustomSkill = async (req, res) => {
  const { skill } = req.body;
  const user = await User.findById(req.user._id);
  if (!user.skills.includes(skill)) {
    user.skills.push(skill);
    await user.save();
  }
  res.json({ success: true, skills: user.skills });
};

const removeSkill = async (req, res) => {
  const { skill } = req.body;
  const user = await User.findById(req.user._id);
  user.skills = user.skills.filter(s => s !== skill);
  await user.save();
  res.json({ success: true, skills: user.skills });
};

const updateProfile = async (req, res) => {
  const { firstName,lastName,  resume, photo } = req.body;
  const updateData = { firstName, lastName , resume, photo  };
  if (req.files['resume']) updateData.resume = req.files['resume'][0].path;
  if (req.files['photo']) updateData.photo = req.files['photo'][0].path;
  const updated = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
  res.json(updated);
};

const updateUser = async (req, res) => {
	const { firstName,lastName, email, password,phone, country,state,city, address,resume,photo,bio } = req.body;
	let { profilePic } = req.body;

  const userId = req.user._id;
  console.log( userId );
  console.log(req.params._id);
  
  
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

    // if ( req.params.id !== userId.toString() )
    // {
    //   return res.status(400).json({ error: "You cannot update other user's profile" });
    // }
			

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
		user.resume = resume || user.resume;
		user.photo = photo || user.photo;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

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
  } catch ( err )
  {
    console.log(err);
    
		res.status(500).json({ error: err.message });
    console.log( "Error in updateUser: ", err.message );
    
	}
};
// Change Profile Picture
const updatePhoto = async (req, res) => {
  try {
      const { id } = req.params;
      const userId = req.user._id;

      if (id !== userId) {
          return res.status(403).json({ message: "Unauthorized: You can only change your own profile image." });
      }

      if (!req.file) {
          return res.status(422).json({ message: "Please select an image." });
      }

    
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ message: "Student not found." });
      }

    
      // Default avatar URL
      const defaultAvatar = "https://res.cloudinary.com/dq5puvtne/image/upload/v1740648447/next_crib_avatar_jled2z.jpg";

      // Delete old Cloudinary image (if exists)
      if (user.profilePic && user.profilePic !== defaultAvatar) {
          const publicIdMatch = user.profilePic.match(/\/([^/]+)\.[a-z]+$/);
          if (publicIdMatch) {
              const publicId = `intern_profile/${publicIdMatch[1]}`;
              await cloudinary.uploader.destroy(publicId);
          }
      }

      // Save new image URL from multer-cloudinary
      user.profilePic = req.file.path;
      await user.save();

      return res.status(200).json({
          message: "File successfully uploaded.",
          profilePic: user.profilePic,
      });
  } catch (err) {
      console.error("Error processing request:", err);
      return res.status(500).json({ message: "An error occurred while processing your request." });
  }
};

// controllers/intern.controller.js


const getAllInterns = async (req, res) => {
  try {
    const profiles = await InternProfile.find({ user: { $ne: null } })
      .populate('user', 'firstName lastName profilePic')
      .populate('selectedCourses', 'name')
      .populate('selectedSkills', 'name');

    // Format the data for frontend use
    const interns = profiles
      .filter(profile => profile.user) // Ensure the user is not null
      .map(profile => ({
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        profilePic: profile.user.profilePic || null,
        location: profile.location || '',
        headline: profile.headline || '',
        courses: profile.selectedCourses.map(course => course.name),
        skills: profile.selectedSkills.map(skill => skill.name),
        userId: profile.user._id
      }));

    res.status(200).json({ success: true, interns });
  } catch (error) {
    console.error("Error fetching interns:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

  
export
{
  createIntern, getInterns, getSkillsByCourse, updateCourses,
  updateProfile, updateSkills, addCustomSkill, removeSkill,
  updateUser, updatePhoto,getAllInterns
}
  
  





