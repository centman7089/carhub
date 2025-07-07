// @ts-nocheck
// models/InternProfile.js
import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  // Required fields for all resumes
  fileName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },

  // Fields for Cloudinary uploads
  sourceType: {
    type: String,
    enum: ['cloudinary', 'url'],
    required: true
  },
  public_id: {
    type: String,
    required: function() { return this.sourceType === 'cloudinary'; }
  },
  format: {
    type: String,
    required: function() { return this.sourceType === 'cloudinary'; }
  },
  size: {
    type: Number,
    required: function() { return this.sourceType === 'cloudinary'; }
  },
  resourceType: {
    type: String,
    enum: ['image', 'pdf', 'raw'],
    default: 'pdf'
  },

  // Fields for URL-based resumes
  host: {
    type: String,
    required() { return this.sourceType === 'url'; },
    default() { return this.url ? new URL(this.url).hostname : undefined; }
  }
});

const internProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  resumes: [resumeSchema], // Array of resumes
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
  workType: {
    type: String,
    enum: ['remote', 'hybrid']
  },
  headline: String,
  location: String,
  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true } );

// Keep only the 5 most recent resumes
internProfileSchema.pre( 'save', function ( next )
{
  if ( this.resumes.length > 5 )
  {
    this.resumes = this.resumes
      .sort( ( a, b ) => b.uploadedAt - a.uploadedAt ) // correct field name
      .slice( 0, 5 );
  }
  next()
} );

const InternProfile = mongoose.model('InternProfile', internProfileSchema);
export default InternProfile;










