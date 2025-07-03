// @ts-nocheck
import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
  sourceType: { type: String, required: true },
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  format: { type: String }, // Made optional
  publicId: { type: String }, // Made optional
  host: { type: String },
  isActive: { type: Boolean, default: false },
  size: { type: Number },
  resourceType: { type: String },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: false
  }
});


const InternProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  headline: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  about: {
    type: String,
    trim: true
  },
  selectedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  selectedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  technicalLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  educationLevel: {
    type: String,
    enum: ['high_school', 'associate', 'bachelor', 'master', 'phd']
  },
  experience: [{
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    location: {
      type: String
    },
    from: {
      type: Date,
      required: true
    },
    to: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String
    }
  }],
  education: [{
    school: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    fieldOfStudy: {
      type: String,
      required: true
    },
    from: {
      type: Date,
      required: true
    },
    to: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String
    }
  }],
  resumeUrl: String,
  resumeFile: String,
  completedOnboarding: {
    type: Boolean,
    default: false
  },
  resume: {
    url: String,
    public_id: String,
    format: String
  },
  resumes: [ResumeSchema]
});

// Keep only the 5 most recent resumes
InternProfileSchema.pre('save', function(next) {
  if (this.resumes.length > 5) {
    // Sort by uploadDate (newest first) and keep only first 5
    this.resumes = this.resumes
      .sort((a, b) => b.uploadDate - a.uploadDate)
      .slice(0, 5);
  }
  next();
});

const InternProfile = mongoose.model( 'InternProfile', InternProfileSchema );


export default InternProfile