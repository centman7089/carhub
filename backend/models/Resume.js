import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema( {
  filePath: String,
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Resume', resumeSchema);