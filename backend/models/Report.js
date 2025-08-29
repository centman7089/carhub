import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  reportedItemId: { type: mongoose.Schema.Types.ObjectId },
  reportType: { type: String, enum: ['car', 'auction', 'user', 'other'], default: 'other' },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model( 'Report', reportSchema );

export default Report
