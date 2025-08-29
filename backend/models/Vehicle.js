import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  make: String,
  model: String,
  year: String,
  vin: String,
  bodyType: String,
  fuelType: String,
  transmission: String,
  price: Number,
  mileage: Number,
  color: String,
  description: String,
  features: [String],
  images: [String], // array of Cloudinary URLs
}, { timestamps: true });

const Vehicle = mongoose.model( "Vehicle", vehicleSchema );
export default Vehicle 
