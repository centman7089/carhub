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
import mongoose from "mongoose";


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


// Helper function to process URL resumes
const processResumeUrl = async (url, userId) => {
  // Your existing URL resume processing logic from saveUrlResume
  // Return the resume data object
  return {
    sourceType: 'url',
    url,
    fileName: url.split('/').pop() || `resume_${Date.now()}`,
    isActive: true,
    uploadedAt: new Date()
  };
};

// Helper function to process file resumes
const processResumeFile = async (fileReference, userId) => {
  // Your existing file upload processing logic from uploadResumeCloud
  // Return the resume data object
  return {
    sourceType: 'cloudinary',
    url: fileReference.url,
    public_id: fileReference.public_id,
    fileName: fileReference.originalname,
    isActive: true,
    uploadedAt: new Date()
  };
};




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
const uploadResumeCloud = async (req, res, next) => {
  try {
    // 1. Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - please log in'
      });
    }

    // 2. Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded',
        details: 'Please select a resume file'
      });
    }

    // 3. Prepare resume data
    const resumeData = {
      public_id: req.file.public_id,
      url: req.file.path,
      format: req.file.format,
      fileName: req.file.originalname,
      isActive: true,
      size: req.file.size,
      resourceType: req.file.resource_type,
      uploadedAt: new Date()
    };

    // 4. Find or create profile
    let profile = await InternProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = await InternProfile.create({ user: req.user._id });
    }

    // 5. Deactivate other resumes
    await InternProfile.updateOne(
      { user: req.user._id, 'resumes.isActive': true },
      { $set: { 'resumes.$[].isActive': false } }
    );

    // 6. Add new resume
    const updatedProfile = await InternProfile.findOneAndUpdate(
      { user: req.user._id },
      { $push: { resumes: resumeData } },
      { new: true }
    );

    // 7. Return success response
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: req.file.public_id,
        url: req.file.path,
        fileName: req.file.originalname,
        size: req.file.size,
        public_id: req.file.public_id
      },
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    
    // Special handling for Multer/Cloudinary errors
    if (error.name === 'MulterError') {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// @route   PUT api/onboarding/set-active-resume/:resumeId
// @desc    Set a specific resume as active
// @access  Private (Job Seeker)
const setActiveResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    // Validate resumeId
    if (!resumeId || typeof resumeId !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid resume ID'
      });
    }

    const profile = await InternProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    // Check if resume exists
    const resumeExists = profile.resumes.some(
      r => r._id.toString() === resumeId
    );
    
    if (!resumeExists) {
      return res.status(404).json({ 
        success: false,
        message: 'Resume not found in your profile'
      });
    }

    // Update all resumes - set only the specified one as active
    profile.resumes = profile.resumes.map(resume => ({
      ...resume.toObject(),
      isActive: resume._id.toString() === resumeId
    }));

    await profile.save();

    res.json({
      success: true,
      message: 'Active resume updated successfully',
      data: {
        activeResume: profile.resumes.find(r => r.isActive),
        totalResumes: profile.resumes.length
      }
    });

  } catch (err) {
    console.error('Set active resume error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @route   DELETE api/onboarding/delete-resume/:resumeId
// @desc    Delete a specific resume
// @access  Private (Job Seeker)
const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    // Validate resumeId
    if (!resumeId || typeof resumeId !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid resume ID'
      });
    }

    const profile = await InternProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    // Find the resume to delete
    const resumeToDelete = profile.resumes.id(resumeId);
    if (!resumeToDelete) {
      return res.status(404).json({ 
        success: false,
        message: 'Resume not found in your profile'
      });
    }

    // Delete from Cloudinary if it's a cloudinary-stored resume
    if (resumeToDelete.sourceType === 'cloudinary' && resumeToDelete.public_id) {
      try {
        await cloudinary.uploader.destroy(resumeToDelete.public_id, {
          resource_type: resumeToDelete.resourceType || 'auto'
        });
      } catch (cloudinaryErr) {
        console.error('Cloudinary delete error:', cloudinaryErr);
        // Continue with deletion even if Cloudinary fails
      }
    }

    // Remove from array
    profile.resumes = profile.resumes.filter(
      resume => !resume._id.equals(resumeToDelete._id)
    );

    // Set a new active resume if needed
    if (resumeToDelete.isActive && profile.resumes.length > 0) {
      profile.resumes[0].isActive = true;
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully',
      data: {
        deletedResumeId: resumeId,
        activeResume: profile.resumes.find(r => r.isActive),
        totalResumes: profile.resumes.length
      }
    });

  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

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
      timeout: 30000,
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
      host: new URL(req.body.url).hostname,   // <— add this
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

  } catch ( error )
  {
    console.log(error);
    
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


const CompleteOnboarding = async (req, res) => {
  /* ────── 1. VALIDATION ────── */
  await check('selectedCourses', 'At least one course is required')
    .customSanitizer(v => (Array.isArray(v) ? v : [v]))
    .isArray({ min: 1 })
    .run(req);

  await check('selectedSkills', 'At least one skill is required')
    .customSanitizer(v => (Array.isArray(v) ? v : [v]))
    .isArray({ min: 1 })
    .run(req);

  await check('technicalLevel', 'Technical level is required')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .run(req);

  await check('educationLevel', 'Education level is required')
    .isIn(['high school', 'bachelor', 'master', 'phd'])
    .run(req);

  await check('workType', 'workType is required')
    .isIn(['remote', 'hybrid', 'onsite', 'open to any'])
    .run(req);

  // require either resumeUrl OR resumeFile
  await check('resumeUrl', 'Resume URL is required if no file is uploaded')
    .if(check('resumeFile').not().exists())
    .notEmpty()
    .isURL()
    .run(req);

  await check('resumeFile', 'Resume file reference is required if no URL is provided')
    .if(check('resumeUrl').not().exists())
    .notEmpty()
    .isString()
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status( 400 ).json( { errors: errors.array() } );
  }

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  /* ────── 2. CORE LOGIC ────── */
  try {
    const {
      selectedCourses,
      selectedSkills,
      technicalLevel,
      educationLevel,
      workType,
      resumeUrl,
      resumeFile
    } = req.body;


  // Capitalize values for enum fields
const formattedTechnicalLevel = capitalize(technicalLevel);
const formattedEducationLevel = capitalize(educationLevel);
const formattedWorkType = workType
  .split(' ')
  .map(capitalize)
  .join(' ');

    // Check if user already completed onboarding
    const user = await User.findById(req.user.id);
    if (user.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Onboarding already completed'
      });
    }

    /* ---- Process resume ---- */
    let resumeData;
    if (resumeUrl) {
      resumeData = await processResumeUrl(resumeUrl, req.user.id);
    } else if (resumeFile) {
      resumeData = await processResumeFile(resumeFile, req.user.id);
    }

    // Deactivate any existing active resumes & push the new one
    const updatedProfile = await InternProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          selectedCourses,
          selectedSkills,
          technicalLevel: formattedTechnicalLevel,
          educationLevel: formattedEducationLevel,
          workType: formattedWorkType,
          onboardingCompleted: true
        },
        $push: {
          resumes: { ...resumeData, isActive: true }
        },
        $setOnInsert: { user: req.user.id }
      },
      { new: true, upsert: true }
    )
      .populate('selectedCourses', 'name')
      .populate('selectedSkills', 'name');

    // Mark previous resumes inactive in a second step
    await InternProfile.updateOne(
      { user: req.user.id },
      { $set: { 'resumes.$[elem].isActive': false } },
      {
        arrayFilters: [{ 'elem.isActive': true, 'elem._id': { $ne: resumeData._id } }]
      }
    );

    /* ---- Update user flag ---- */
    user.onboardingCompleted = true;
    await user.save();

    /* ---- Response ---- */
    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      profile: {
        selectedCourses: updatedProfile.selectedCourses,
        selectedSkills: updatedProfile.selectedSkills,
        technicalLevel: updatedProfile.technicalLevel,
        educationLevel: updatedProfile.educationLevel,
        workType: updatedProfile.workType,
        resumes: updatedProfile.resumes,
        activeResume: updatedProfile.resumes.find(r => r.isActive)
      }
    });
  } catch (err) {
    console.error('Complete onboarding error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

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


const getUserResumes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 5; // Fixed limit of 5 resumes per request
    const skip = ( page - 1 ) * limit;
    
//     const profile = await InternProfile.findOne({ user: req.user.id })
//   .select('resumes')
//   .lean();

// const paginatedResumes = profile.resumes
//   .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) // Newest first
//   .slice(skip, skip + limit);

    const profile = await InternProfile.findOne({ user: req.user.id })
      .select('resumes')
      .slice('resumes', [skip, limit])
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const totalResumes = profile.resumes.length;
    const totalPages = Math.ceil(totalResumes / limit);

    res.json({
      success: true,
      data: {
        resumes: profile.resumes,
        pagination: {
          currentPage: page,
          totalPages,
          totalResumes,
          resumesPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        activeResume: profile.resumes.find(r => r.isActive) || null
      }
    });

  } catch ( err )
  {
    console.log(error);
    
    console.error('Get resumes error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export
{
  getAllCourse, getCourseSkill,setActiveResume, deleteResume,
  uploadResumeCloud,CompleteOnboarding,saveUrlResume,updateUrlResume, validateUrlResume,getUserResumes
}