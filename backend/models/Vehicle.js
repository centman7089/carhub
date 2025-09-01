import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // link to dealer who added the car
    },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
    vin: { type: String, required: true, unique: true },
    bodyType: String,
    fuelType: String,
    transmission: String,
    price: { type: Number, required: true },
    mileage: Number,
    color: String,
    description: String,
    features: [String],
    images: [String], // Cloudinary URLs
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
