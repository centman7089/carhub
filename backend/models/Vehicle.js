// models/vehicleModel.js
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: String,
  state: String,
  city: String,
  zipCode: String,
});

const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, unique: true, required: true },
  carrierCompany: { type: String, required: true },
  expectedDelivery: { type: Date },
  shippingStatus: {
    type: String,
    enum: ["Pending", "In Transit", "Delivered", "Cancelled"],
    default: "Pending",
  },
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  shippingCost: Number,
  insuranceValue: Number,
  priorityLevel: { type: String, enum: ["Standard", "Express", "Overnight"] },
  specialInstructions: String,
});

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
     // Listing Info
    location: {
      state: String,
      city: String,
    },
    dateListed: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Sold"],
      default: "Active",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    // Performance
    views: { type: Number, default: 0 },
    interestedBuyers: { type: Number, default: 0 },
    shipment: shipmentSchema,
    // ✅ Relation to user (dealer)
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin", // or "User" if your admin is also in User schema
  required: true,
},
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
