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


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateUrlResume = [
  check('url')
    .trim()
    .notEmpty().withMessage('URL is required')
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    }).withMessage('Must be a valid URL with http:// or https://')
];




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
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        details: 'Please select a resume file to upload'
      });
    }

    // Prepare resume data from Cloudinary response
    const resumeData = {
      url: req.file.path,
      public_id: req.file.filename,
      format: req.file.format,
      fileName: req.file.originalname,
      isActive: true,
      size: req.file.size,
      resourceType: req.file.resource_type,
      uploadedAt: new Date()
    };

    // Update database
    const updateOperations = [
      // Deactivate all other resumes
      InternProfile.updateMany(
        { user: req.user.id, 'resumes.isActive': true },
        { $set: { 'resumes.$[].isActive': false } }
      ),
      // Add new resume
      InternProfile.findOneAndUpdate(
        { user: req.user.id },
        { $push: { resumes: resumeData } },
        { new: true, upsert: true }
      )
    ];

    const [, updatedProfile] = await Promise.all(updateOperations);

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: req.file.filename,
        url: req.file.path,
        fileName: req.file.originalname,
        format: req.file.format,
        size: req.file.size,
        isActive: true
      },
      user: {
        id: req.user.id,
        totalResumes: updatedProfile.resumes.length
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle different error cases
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type',
        details: error.message
      });
    }

    if (error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        details: 'Maximum file size is 10MB'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to upload resume',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
  // Validate input
  await Promise.all(validateUrlResume.map(validation => validation.run(req)));
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { url } = req.body;
    let isGoogleDrive = false;

    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/file\/d\/([^\/]+)/)?.[1] || 
                    url.match(/id=([^&]+)/)?.[1];
      
      if (fileId) {
        url = `https://drive.google.com/uc?export=download&id=${fileId}`;
        isGoogleDrive = true;
      }
    }

    // Download the file
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const buffer = Buffer.from(response.data, 'binary');

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        errors: [{ msg: `File exceeds ${MAX_FILE_SIZE/1024/1024}MB size limit` }]
      });
    }

    // Get filename from headers or URL
    let filename = response.headers['content-disposition']
      ?.match(/filename="?(.+?)"?(;|$)/i)?.[1] || 
      new URL(url).pathname.split('/').pop() || 
      `resume_${Date.now()}`;

    // Clean filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'jobseekers-resumes',
      public_id: filename.replace(/\.[^/.]+$/, ''),
      resource_type: 'auto'
    });

    // Prepare resume data
    const resumeData = {
      sourceType: 'cloudinary',
      url: uploadResult.secure_url,
      fileName: filename,
      format: uploadResult.format || 'unknown',
      publicId: uploadResult.public_id,
      host: new URL(url).hostname,
      isActive: true,
      size: uploadResult.bytes,
      resourceType: uploadResult.resource_type,
      isGoogleDrive
    };

    // Update database
    let profile = await InternProfile.findOne({ user: req.user?.id }) || 
                 new InternProfile({ user: req.user?.id, resumes: [] });

    // Deactivate other resumes
    profile.resumes.forEach(r => r.isActive = false);
    profile.resumes.push(resumeData);
    await profile.save();

    return res.json({
      success: true,
      resume: resumeData,
      message: 'Resume uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(400).json({ 
        errors: [{ msg: 'File not found at the provided URL' }]
      });
    }
    
    if (error.message.includes('File size too large')) {
      return res.status(400).json({ 
        errors: [{ msg: `File exceeds ${MAX_FILE_SIZE/1024/1024}MB size limit` }]
      });
    }

    return res.status(500).json({ 
      errors: [{ msg: 'Failed to process resume URL', error: error.message }]
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
  uploadResumeCloud,CompleteOnboarding,saveUrlResume,updateUrlResume, validateUrlResume
}