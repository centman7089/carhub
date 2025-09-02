import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    vin: { type: String, required: true, unique: true },
    bodyType: { type: String },
    fuelType: { type: String },
    transmission: { type: String },
    price: { type: Number, required: true },
    mileage: { type: Number },
    color: { type: String },
    condition: { type: String },
    lotNumber: { type: String },
    description: { type: String },
    image: { type: Array,required:true},
    // ✅ Images
    mainImage: {
      type: String, // single image URL
      required: true,
    },
    supportingImages: [
      {
        type: String, // array of image URLs
      },
    ],

    features: {
      type: [String], // list of features
      default: [],
    },

    // ✅ Location
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },

    // ✅ Status (draft, published, sold, etc.)
    status: {
      type: String,
      enum: ["draft", "published", "sold"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
