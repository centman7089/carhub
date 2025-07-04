// @ts-nocheck

import User from "../models/userModel.js";
import Course from "../models/Course.js";
import InternProfile from "../models/internProfile.js";
import { check, validationResult } from "express-validator"
import validUrl from "valid-url"
import Skill from "../models/Skill.js";
import { cloudinary,uploadToCloudinary } from "../db/config.js"
import axios from 'axios';
import { Readable } from 'stream';
import { log } from "console";




// @route   GET api/onboarding/courses
// @desc    Get all courses for selection
// @access  Private (Intern)
const getAllCourse =  async (req, res) => {
    try {
      const courses = await Course.find().select(-'name description category relatedSkills');
      res.json(courses);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
}

// @route   GET api/onboarding/skills/:courseId
// @desc    Get skills for a specific course
// @access  Private (Job Seeker)
const getCourseSkill =  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId).populate('relatedSkills', 'name category');
      
      if (!course) {
        return res.status(404).json({ msg: 'Course not found' });
      }
  
      res.json(course.relatedSkills);
    } catch ( err )
    {
      console.log(err);
      
      console.error(err.message);
      res.status(500).send('Server Error');
    }
}
 

// @route   POST api/onboarding/upload-resume
// @desc    Upload resume to Cloudinary during onboarding
// @access  Private (Job Seeker)

const uploadResumeCloud = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    // Validate file type
    const validMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, DOC, DOCX, JPEG, or PNG files are allowed'
      });
    }

    // Validate file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }

    // Upload to Cloudinary using our config utility
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'intern-resumes',
      public_id: req.file.originalname.replace(/\.[^/.]+$/, ""),
      resource_type: 'auto'
    });

    // Mark all other resumes as inactive
    await InternProfile.updateMany(
      { user: req.user.id, 'resumes.isActive': true },
      { $set: { 'resumes.$[].isActive': false } }
    );

    // Save to database
    const profile = await InternProfile.findOneAndUpdate(
      { user: req.user.id },
      { 
        $push: { 
          resumes: {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            fileName: req.file.originalname,
            isActive: true,
            size: result.bytes,
            resourceType: result.resource_type
          }
        } 
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Resume uploaded to Cloudinary successfully',
      resume: {
        url: result.secure_url,
        public_id: result.public_id,
        id: result.public_id,
        fileName: req.file.originalname,
        format: result.format,
        size: result.bytes
      }
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};


// @route   PUT api/onboarding/set-active-resume/:resumeId
// @desc    Set a specific resume as active
// @access  Private (Job Seeker)
const setActiveResume = async (req, res) => {
  try {
    const profile = await InternProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Find and activate the specified resume
    let foundResume = false;
    profile.resumes = profile.resumes.map(resume => {
      if (resume._id.toString() === req.params.resumeId) {
        foundResume = true;
        return { ...resume.toObject(), isActive: true };
      }
      return { ...resume.toObject(), isActive: false };
    });

    if (!foundResume) {
      return res.status(404).json({ msg: 'Resume not found' });
    }

    await profile.save();
    res.json({
      resumes: profile.resumes,
      activeResume: profile.resumes.find(r => r.isActive)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

// @route   DELETE api/onboarding/delete-resume/:resumeId
// @desc    Delete a specific resume
// @access  Private (Job Seeker)
const deleteResume =  async (req, res) => {
  try {
    const profile = await InternProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Find and remove the resume
    const resumeToDelete = profile.resumes.id(req.params.resumeId);
    if (!resumeToDelete) {
      return res.status(404).json({ msg: 'Resume not found' });
    }

    // Delete from Cloudinary first
    await cloudinary.uploader.destroy(resumeToDelete.public_id);

    // Remove from array
    profile.resumes = profile.resumes.filter(
      resume => !resume._id.equals(resumeToDelete._id)
    );

    // If we deleted the active resume and there are others, make the first one active
    if (resumeToDelete.isActive && profile.resumes.length > 0) {
      profile.resumes[0].isActive = true;
    }

    await profile.save();

    res.json({
      resumes: profile.resumes,
      activeResume: profile.resumes.find(r => r.isActive),
      msg: 'Resume deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

// @route   POST /api/onboarding/save-url-resume
// @desc    Save resume from URL (Google Drive, etc.)
// @access  Private (Job Seeker)

const saveUrlResume = async (req, res) => {
  // Validation
  await check('url', 'Valid URL is required').isURL().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { url } = req.body;
    const host = new URL(url).hostname;

    // Try to download and upload to Cloudinary first
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      const fileBuffer = Buffer.from(response.data, 'binary');

      if (fileBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ msg: 'File size exceeds 10MB limit' });
      }

      const urlPath = new URL(url).pathname;
      let fileName = urlPath.split('/').pop() || 'resume';
      fileName = fileName.split('?')[0];
      if (!fileName || fileName.lastIndexOf('.') <= 0) {
        fileName = `file_from_${host}`;
      }

      const result = await uploadToCloudinary(fileBuffer, {
        folder: 'resumes',
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        overwrite: true
      });

      let profile = await InternProfile.findOne({ user: req.user.id });
      if (!profile) {
        profile = new InternProfile({
          user: req.user.id,
          resumes: []
        });
      }

      const newResume = {
        sourceType: 'cloudinary',
        url: result.secure_url,
        fileName,
        format: result.format || 'unknown',
        publicId: result.public_id,
        host,
        isActive: true,
        size: result.bytes,
        resourceType: result.resource_type
      };

      // Mark others as inactive
      profile.resumes.forEach(resume => {
        resume.isActive = false;
      });

      profile.resumes.push(newResume);
      await profile.save();

      return res.json({
        resume: newResume,
        msg: 'File uploaded to Cloudinary successfully'
      });

    } catch (downloadError) {
      console.log('Download failed, saving as direct link');
      
      // Direct link fallback
      let profile = await InternProfile.findOne({ user: req.user.id });
      if (!profile) {
        profile = new InternProfile({
          user: req.user.id,
          resumes: []
        });
      }

      const newResume = {
        sourceType: 'url',
        url,
        fileName: `direct_link_${Date.now()}`,
        format: 'link',
        publicId: null,
        host,
        isActive: true,
        size: 0,
        resourceType: 'link'
      };

      profile.resumes.forEach(resume => {
        resume.isActive = false;
      });

      profile.resumes.push(newResume);
      await profile.save();

      return res.json({
        resume: newResume,
        msg: 'URL saved as direct link'
      });
    }

  } catch ( err )
  {
    console.log(err);
    
    console.error(err.message);
    if (err instanceof TypeError && err.message.includes('Invalid URL')) {
      return res.status(400).json({ msg: 'Invalid URL format' });
    }
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message 
    });
  }
};








const CompleteOnboarding = async ( req, res ) =>
{
  [
    check('selectedCourses', 'At least one course is required').isArray({ min: 1 }),
    check('selectedSkills', 'At least one skill is required').isArray({ min: 1 }),
    check('technicalLevel', 'Technical level is required').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    check('educationLevel', 'Education level is required').isIn(['high_school', 'associate', 'bachelor', 'master', 'phd']),
    check('headline', 'Professional headline is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty()
  ]
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      selectedCourses,
      selectedSkills,
      technicalLevel,
      educationLevel,
      headline,
      location
    } = req.body;

    // Check if user already completed onboarding
    const user = await User.findById(req.user.id);
    if (user.onboardingCompleted) {
      return res.status(400).json({ msg: 'Onboarding already completed' });
    }

    // Update or create profile
    let profile = await InternProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        selectedCourses,
        selectedSkills,
        technicalLevel,
        educationLevel,
        headline,
        location,
        completedOnboarding: true
      },
      { new: true, upsert: true }
    ).populate('selectedCourses', 'name description')
     .populate('selectedSkills', 'name category');

    // Mark user as onboarded
    user.onboardingCompleted = true;
    await user.save();

    res.json({
      profile,
      msg: 'Onboarding completed successfully'
    });
  } catch ( err )
  {
    console.log(err);
    
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

const updateUrlResume = async (req, res) => {
  // Validation
  check('url', 'Valid URL is required').isURL();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { url } = req.body;
    const { resumeId } = req.params; // Get resumeId from URL parameter
    const host = new URL(url).hostname;

    // Extract filename from URL
    const urlPath = new URL(url).pathname;
    let fileName = urlPath.split('/').pop() || 'resume';
    fileName = fileName.split('?')[0];
    if (!fileName || fileName.lastIndexOf('.') <= 0) {
      fileName = `resume_from_${host}`;
    }

    // Find the profile
    const profile = await InternProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Find the resume to update
    const resumeIndex = profile.resumes.findIndex(
      resume => resume._id.toString() === resumeId
    );

    if (resumeIndex === -1) {
      return res.status(404).json({ msg: 'Resume not found' });
    }

    // Update the resume
    profile.resumes[resumeIndex] = {
      ...profile.resumes[resumeIndex].toObject(),
      url,
      fileName,
      host,
      updatedAt: new Date()
    };

    await profile.save();

    res.json({
      resume: profile.resumes[resumeIndex],
      msg: 'Resume updated successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err instanceof TypeError && err.message.includes('Invalid URL')) {
      return res.status(400).json({ msg: 'Invalid URL format' });
    }
    res.status(500).send('Server Error');
  }
};


export
{
  getAllCourse, getCourseSkill,setActiveResume, deleteResume,
  uploadResumeCloud,CompleteOnboarding,saveUrlResume,updateUrlResume
}