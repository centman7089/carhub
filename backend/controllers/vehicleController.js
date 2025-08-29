// @ts-nocheck
import Vehicle from "../models/Vehicle.js"
// const cloudinary = require( "../utils/cloudinary" );
import cloudinary from "../utils/cloudinary.js";

const uploadToCloudinary = async (fileBuffer, filename) => {
  return await cloudinary.uploader.upload_stream({
    folder: "vehicles",
    public_id: filename.split(".")[0],
    resource_type: "image",
  }, (err, result) => {
    if (err) throw err;
    return result;
  }).end(fileBuffer);
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    const imageUrls = [];

    if (req.files) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload_stream(
          {
            folder: "vehicles",
            resource_type: "image",
          },
          (error, result) => {
            if (result?.secure_url) imageUrls.push(result.secure_url);
          }
        ).end(file.buffer);
      }
    }

    const vehicle = new Vehicle({
      ...req.body,
      features: req.body.features || [],
      images: imageUrls,
    });

    const saved = await vehicle.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all vehicles with optional search
const getVehicles = async (req, res) => {
  try {
    const query = {};

    if (req.query.make) query.make = new RegExp(req.query.make, "i");
    if (req.query.year) query.year = req.query.year;
    if (req.query.model) query.model = new RegExp(req.query.model, "i");

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.status(200).json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single vehicle
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });
    res.status(200).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });

    const imageUrls = [...vehicle.images];

    if (req.files?.length) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload_stream(
          {
            folder: "vehicles",
            resource_type: "image",
          },
          (error, result) => {
            if (result?.secure_url) imageUrls.push(result.secure_url);
          }
        ).end(file.buffer);
      }
    }

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        features: req.body.features || [],
        images: imageUrls,
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export {createVehicle, getVehicleById, getVehicles, updateVehicle, deleteVehicle}