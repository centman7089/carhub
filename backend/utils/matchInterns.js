import Job from '../models/jobModel.js';
import InternProfile from '../models/internProfile.js';

export const matchInternsToJob = async (jobId) => {
  // Fetch the job using its ID
  const job = await Job.findById(jobId).populate('requiredSkills');

  if (!job) {
    throw new Error("Job not found");
  }

  // Match interns based on work type, education level, technical level, and skill overlap
  const matchedInterns = await InternProfile.find({
    workType: job.workType,
    technicalLevel: job.technicalLevel,
    educationLevel: job.educationLevel,
    selectedSkills: { $in: job.requiredSkills } // at least one skill should match
  });

  // Save matched interns to the job document
  job.matchedInterns = matchedInterns.map(intern => intern._id);
  await job.save();

  return matchedInterns;
};
