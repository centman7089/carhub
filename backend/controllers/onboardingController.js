// @ts-nocheck

import User from "../models/userModel.js";
import Course from "../models/Course.js";
import InternProfile from "../models/internProfile.js";
import { check, validationResult } from "express-validator"
import validUrl from "valid-url"
import Skill from "../models/Skill.js";




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
// @desc    Upload resume during onboarding
// @access  Private (Job Seeker)
// const uploadResume = async (req, res) => {
//   try
//   {
//     const {file} = req.body
//     if (!req.file) {
//       return res.status(400).json({ msg: 'No file uploaded' });
//     }

//     // Check if user already has a profile
//     let profile = await InternProfile.findOne({ user: req.user.id });
    
//     if (!profile) {
//       // Create new profile if doesn't exist
//       profile = new InternProfile({
//         user: req.user.id,
//         resumes: []
//       });
//     }

//     // Add new resume (mark as active)
//     const newResume = {
//       sourceType: 'upload',
//       url: req.file.path,
//       fileName: req.file.originalname,
//       format: path.extname(req.file.originalname).slice(1),
//       isActive: true
//     };

//     // Mark all other resumes as inactive
//     if (profile.resumes && profile.resumes.length > 0) {
//       profile.resumes.forEach(resume => {
//         resume.isActive = false;
//       });
//     }

//     profile.resumes.push(newResume);
//     await profile.save();

//     res.json({
//       resume: newResume,
//       msg: 'Resume uploaded successfully'
//     });
//   } catch (err) {
//     console.error(err.message);
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ msg: 'File size cannot exceed 5MB' });
//     }
//     res.status(500).send('Server Error');
//   }
// }

// @route   POST api/onboarding/upload-resume
// @desc    Upload resume to Cloudinary during onboarding
// @access  Private (Job Seeker)

const uploadResumeCloud =  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    // File is automatically uploaded to Cloudinary by multer
    const result = {
      public_id: req.file.public_id,
      url: req.file.path,
      format: req.file.format
    };

    // Save to database (example using Mongoose)
    const profile = await InternProfile.findOneAndUpdate(
      { user: req.user.id },
      { 
        $push: { 
          resumes: {
            url: result.url,
            public_id: result.public_id,
            format: result.format,
            fileName: req.file.originalname,
            isActive: true
          }
        } 
      },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        url: result.url,
        public_id: result.public_id,
        id: req.file.public_id
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
}


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

  
  const saveUrlResume =
  async ( req, res ) =>
  {
    check('url', 'Valid URL is required').isURL(),
    check('fileName', 'File name is required').not().isEmpty()
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { url, fileName } = req.body;
      const host = new URL(url).hostname;

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
        fileName,
        format: 'link',
        host,
        isActive: true
      };

      // Mark all other resumes as inactive
      if (profile.resumes && profile.resumes.length > 0) {
        profile.resumes.forEach(resume => {
          resume.isActive = false;
        });
      }

      profile.resumes.push(newResume);
      await profile.save();

      res.json({
        resume: newResume,
        msg: 'URL resume saved successfully'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }




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


export
{
  getAllCourse, getCourseSkill,setActiveResume, deleteResume,
  uploadResumeCloud,CompleteOnboarding,saveUrlResume
}