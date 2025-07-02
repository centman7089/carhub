// @ts-nocheck

import Course from "../models/Course.js";
import InternProfile from "../models/internProfile.js";
import { check, validationResult } from "express-validator";
import User from "../models/userModel.js";

    
// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const profile = await InternProfile.findOne({ user: req.user.id })
      .populate('selectedCourses', 'name description')
      .populate('selectedSkills', 'name category');

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
const updateProfile = async ( req, res ) =>
{
      [
      check('headline', 'Headline is required').not().isEmpty(),
      check('location', 'Location is required').not().isEmpty()
    ]
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      headline,
      location,
      about,
      skills
    } = req.body;

    // Build profile object
    const profileFields = {
      user: req.user.id,
      headline,
      location,
      about,
      skills: Array.isArray(skills)
        ? skills
        : skills.split(',').map(skill => skill.trim())
    };

    try {
      let profile = await InternProfile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await InternProfile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create
      profile = new InternProfile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }

  // @route   POST api/profile/resume
// @desc    Upload resume
// @access  Private
const resume = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err });
    }

    try {
      const profile = await InternProfile.findOne({ user: req.user.id });
      
      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found' });
      }

      profile.resumeFile = req.file.path;
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
}

// @route   POST api/profile/resume-url
// @desc    Add resume URL
// @access  Private

const resumeUrl =  async ( req, res ) =>
  {
    check('url', 'Valid URL is required').isURL()
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await InternProfile.findOne({ user: req.user.id });
      
      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found' });
      }

      profile.resumeUrl = req.body.url;
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
}

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


export
{
  getProfile,
  updateProfile,
  resume,
  resumeUrl,
  addEducation,
  addExperience
}