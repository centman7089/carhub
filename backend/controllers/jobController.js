
import express from "express"
// const router = express.Router();
// const auth = require('../middleware/auth');
import { check, validationResult} from "express-validator"
// const Job = require('../models/Job');
import InternProfile from "../models/internProfile.js";
import Job from "../models/jobModel.js";
import { matchInternsToJob } from '../utils/matchInterns.js';

// @route   GET api/jobs
// @desc    Get all jobs
// @access  Public
const allJobs =async (req, res) => {
  try {
    const jobs = await Job.find().populate('employer', ['name', 'avatar']);
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET api/jobs/recommended
// @desc    Get recommended jobs based on profile
// @access  Private (Job Seeker)
const recommendJob = async (req, res) => {
  try {
    // Get job seeker profile with skills
    const profile = await InternProfile.findOne({ user: req.user.id })
      .populate('selectedSkills', 'name');

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    // Get jobs that match at least one skill
    const jobs = await Job.find({
      requiredSkills: { $in: profile.selectedSkills.map(skill => skill.name) }
    }).populate('employer', ['name', 'avatar']);

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

// @route   POST api/jobs/apply/:job_id
// @desc    Apply for a job
// @access  Private (Job Seeker)
const applyJobs = async (req, res) => {
  try {
    const job = await Job.findById(req.params.job_id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if already applied
    if (job.applicants.some(applicant => applicant.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already applied for this job' });
    }

    // Add to applicants array
    job.applicants.unshift({ user: req.user.id });
    await job.save();

    res.json(job.applicants);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}



export const createJob = async (req, res) => {
  try {
    const employerId = req.user._id; // authenticated employer
    const {
      title,
      description,
      location,
      workType,
      requiredSkills,
      technicalLevel,
      educationLevel
    } = req.body;

    const newJob = await Job.create({
      title,
      description,
      location,
      workType,
      requiredSkills,
      technicalLevel,
      educationLevel,
      employer: employerId
    });

    const matchedInterns = await matchInternsToJob(newJob._id);

    res.status(201).json({
      message: "Job created and interns matched successfully",
      job: newJob,
      matchedInterns
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export
{
    allJobs,
    recommendJob,
    applyJobs
 }