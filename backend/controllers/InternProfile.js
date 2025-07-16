// @ts-nocheck

import Course from "../models/Course.js";
import InternProfile from "../models/internProfile.js";
import { check, validationResult } from "express-validator";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import { getSkillIdsByNames } from "../utils/skillsHelper.js"; // Import helper

    
// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const profile = await InternProfile.findOne({ user: req.user.id })
      .populate('selectedCourses', 'name description')
      .populate('selectedSkills', 'name category')
      .populate('user', 'firstName lastName email phone state city address');

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    // Merge user and profile data
    const fullProfile = {
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      email: profile.user.email,
      phone: profile.user.phone,
      state: profile.user.state,
      city: profile.user.city,
      address: profile.user.address,
      selectedCourses: profile.selectedCourses.map(course => course.name),
      selectedSkills: profile.selectedSkills.map(skill => skill.name),
      educationLevel: profile.educationLevel,
      technicalLevel: profile.technicalLevel,
      workType: profile.workType,
      about: profile.about,
    };

    res.json(fullProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      firstName,
      lastName,
      phone,
      country,
      state,
      city,
      address,
      headline,
      location,
      about,
      bio,
      technicalLevel,
      educationLevel,
      workType,
      selectedSkills // skill names
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await InternProfile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Intern profile not found" });

    const updatedUserFields = {};
    const updatedProfileFields = {};

    // Update user fields if provided
    if (firstName) updatedUserFields.firstName = firstName;
    if (lastName) updatedUserFields.lastName = lastName;
    if (phone) updatedUserFields.phone = phone;
    if (country) updatedUserFields.country = country;
    if (state) updatedUserFields.state = state;
    if (city) updatedUserFields.city = city;
    if (address) updatedUserFields.address = address;

    // Update profile fields if provided
    if (headline) updatedProfileFields.headline = headline;
    if (about) updatedProfileFields.about = about;
    if (bio) updatedProfileFields.bio = bio;
    if (location) updatedProfileFields.location = location;
    if (technicalLevel) updatedProfileFields.technicalLevel = technicalLevel;
    if (educationLevel) updatedProfileFields.educationLevel = educationLevel;
    if (workType) updatedProfileFields.workType = workType;

    if (Array.isArray(selectedSkills)) {
      const skillIds = await getSkillIdsByNames(selectedSkills);
    
      // Merge new and existing skills
      const existingSkills = profile.selectedSkills.map(id => id.toString());
      const uniqueNewSkills = skillIds.filter(id => !existingSkills.includes(id.toString()));
      profile.selectedSkills = [...uniqueNewSkills, ...profile.selectedSkills];
    
      updatedProfileFields.selectedSkills = profile.selectedSkills;
    }
    

    // Apply updates
    if (Object.keys(updatedUserFields).length > 0) {
      Object.assign(user, updatedUserFields);
      await user.save();
    }

    if (Object.keys(updatedProfileFields).length > 0) {
      Object.assign(profile, updatedProfileFields);
      await profile.save();
    }

    res.status(200).json({
      message: "Profile updated successfully",
      updatedFields: {
        ...(Object.keys(updatedUserFields).length && { user: updatedUserFields }),
        ...(Object.keys(updatedProfileFields).length && { profile: updatedProfileFields }),
      }
    });

  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(400).json({ error: err.message });
  }
};




  // @route   POST api/profile/resume
// @desc    Upload resume
// @access  Private
// const resume = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ msg: err });
//     }

//     try {
//       const profile = await InternProfile.findOne({ user: req.user.id });
      
//       if (!profile) {
//         return res.status(404).json({ msg: 'Profile not found' });
//       }

//       profile.resumeFile = req.file.path;
//       await profile.save();

//       res.json(profile);
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   });
// }

// @route   POST api/profile/resume-url
// @desc    Add resume URL
// @access  Private

// const resumeUrl =  async ( req, res ) =>
//   {
//     check('url', 'Valid URL is required').isURL()
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       const profile = await InternProfile.findOne({ user: req.user.id });
      
//       if (!profile) {
//         return res.status(404).json({ msg: 'Profile not found' });
//       }

//       profile.resumeUrl = req.body.url;
//       await profile.save();

//       res.json(profile);
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
// }

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private

const addExperience =  async ( req, res ) =>
  {
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await InternProfile.findOne({ user: req.user?._id });

      profile.experience.unshift(newExp);
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }


// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private

const addEducation =  async ( req, res ) =>
  {
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await InternProfile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }

  const getUserProfile = async (req, res) => {
    try {
      const { id } = req.params;
  
      let user;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id)
          .select("firstName lastName email phone country state city address")
          .populate({
            path: "profile",
            model: "InternProfile",
            populate: [
              { path: "selectedCourses", model: "Course", select: "name" },
              { path: "selectedSkills", model: "Skill", select: "name category" }
            ]
          });
      } else {
        return res.status(400).json({ error: "Invalid user ID" });
      }
  
      if (!user || !user.profile) {
        return res.status(404).json({ error: "User or profile not found" });
      }
  
      const response = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        state: user.state,
        city: user.city,
        address: user.address,
        selectedCourses: user.profile.selectedCourses.map(course => course.name),
        selectedSkills: user.profile.selectedSkills.map(skill => skill.name),
        educationLevel: user.profile.educationLevel,
        technicalLevel: user.profile.technicalLevel,
        workType: user.profile.workType,
        about: user.profile.about,
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
  

  const updateInternProfilePhoto = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const profile = await InternProfile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({ message: 'Intern profile not found' });
      }
  
      let finalProfilePic;
  
      if (!req.file) {
        // Generate initials-based avatar
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
        finalProfilePic = `https://ui-avatars.com/api/?name=${initials}&background=random`;
      } else {
        const secureUrl = req.file.path;
        finalProfilePic = secureUrl.replace('/upload/', '/upload/w_400,h_400,c_fill,g_face/');
  
        // Delete old Cloudinary image if custom
        if (profile.profilePic && !profile.profilePic.includes('ui-avatars.com')) {
          const match = profile.profilePic.match(/\/intern_profile\/(.+)\.(jpg|jpeg|png)/);
          if (match) {
            const publicId = `intern_profile/${match[1]}`;
            await cloudinary.uploader.destroy(publicId);
          }
        }
      }
  
      // Update user and intern profile
      user.profilePic = finalProfilePic;
      await user.save();
  
      profile.profilePic = finalProfilePic;
      await profile.save();
  
      // Update all posts by user
      await Post.updateMany({ postedBy: userId }, { $set: { profilePic: finalProfilePic } });
  
      return res.status(200).json({
        message: 'Profile photo updated successfully',
        profilePic: finalProfilePic
      });
  
    } catch (err) {
      console.error('Photo update error:', err);
      res.status(500).json({ message: 'Server error while updating profile photo' });
    }
  };
  

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
  

  
  
// const updatePhoto = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // Check if file is uploaded
//     if (!req.file) {
//       return res.status(400).json({ message: "Please upload an image" });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const profile = await InternProfile.findOne({ user: userId });
//     if (!profile) return res.status(404).json({ message: "Intern profile not found" });

//     // Resize image using Cloudinary transformation
//     const transformedUrl = req.file.path.replace(
//       '/upload/',
//       '/upload/w_400,h_400,c_fill,g_face/'
//     );

//     // Delete old Cloudinary image (if not default or avatar)
//     const previousPhoto = user.profilePic || '';
//     if (
//       previousPhoto &&
//       !previousPhoto.includes('ui-avatars.com') &&
//       !previousPhoto.includes('next_crib_avatar') // your default avatar check
//     ) {
//       const match = previousPhoto.match(/\/intern_profile\/(.+?)\.(jpg|jpeg|png)/);
//       if (match) {
//         const publicId = `intern_profile/${match[1]}`;
//         await cloudinary.uploader.destroy(publicId);
//       }
//     }

//     // Update profilePic in User and InternProfile
//     user.profilePic = transformedUrl;
//     await user.save();

//     profile.profilePic = transformedUrl;
//     await profile.save();

//     // Update all posts with new profile photo
//     await Post.updateMany(
//       { postedBy: userId },
//       { $set: { profilePic: transformedUrl } }
//     );

//     res.status(200).json({
//       message: "Profile photo updated successfully",
//       profilePic: transformedUrl
//     });

//   } catch (err) {
//     console.error("Photo update error:", err);
//     res.status(500).json({ message: "Server error while updating profile photo" });
//   }
// };


export
{
  getProfile,
  updateProfile,
  addEducation,
  addExperience,
  getUserProfile,
  updateInternProfilePhoto,
  getAllInterns
}