// models/vehicleModel.js
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    vin: {
      type: String,
      unique: true,
      sparse: true, // allows null if VIN isn’t mandatory
      trim: true,
    },
    bodyType: {
      type: String,
      trim: true,
    },
    fuelType: {
      type: String,
      trim: true,
    },
    transmission: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    mileage: {
      type: Number,
    },
    color: {
      type: String,
    },
    condition: {
      type: String,
      enum: ["new", "used", "salvage", "other"],
      default: "new",
    },
    lotNumber: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    // ✅ Images
    mainImage: {
      type: String, // Cloudinary URL
      required: false,
    },
    supportingImages: [
      {
        type: String, // Cloudinary URLs
      },
    ],
    // ✅ Location info
    zipCode: {
      type: String,
    },
    address: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    // ✅ Relation to user (dealer)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
