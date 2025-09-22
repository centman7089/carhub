// @ts-nocheck
import mongoose from "mongoose";

const bodyTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    icon: { type: String }, // optional (for frontend UI)
  },
  { timestamps: true }
);

const BodyType = mongoose.model("BodyType", bodyTypeSchema);
export default BodyType;
