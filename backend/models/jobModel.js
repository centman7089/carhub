import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,

  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },

  location: String,
  workType: {
    type: String,
    enum: ['Remote', 'Onsite', 'Hybrid']
  },

  requiredSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],

  technicalLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },

  educationLevel: {
    type: String,
    enum: ['High School', 'Diploma', 'Undergraduate', 'Graduate']
  },

  matchedInterns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternProfile'
  }],

  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Job', jobSchema);
