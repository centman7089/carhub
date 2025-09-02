import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
  
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
    condition: String,
    lotNumber: Number,
    description: String,
    features: [ String ],
    images: [String], // Cloudinary URLs
    // status: {
    //   type: String,
    //   enum: ["draft", "published"],
    //   default: "draft",
    // },
    state: String,
    address: String,
    city: String,
    zipCode: String

  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
