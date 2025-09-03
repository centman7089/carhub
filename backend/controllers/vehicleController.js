// controllers/vehicleController.js
import Vehicle from "../models/Vehicle.js";

/**
 * @desc Add a new vehicle (Admin only)
 * @route POST /api/vehicles
 * @access Private (admin)
 */
export const addVehicle = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can add vehicles" });
    }

    const {
      make,
      model,
      year,
      vin,
      bodyType,
      fuelType,
      transmission,
      price,
      mileage,
      color,
      condition,
      lotNumber,
      description,
      features,
      zipCode,
      address,
      state,
      city,
    } = req.body;

    // Collect Cloudinary URLs
    const files = ["image1", "image2", "image3", "image4"]
      .map((field) => req.files?.[field]?.[0]?.path)
      .filter(Boolean);

    const [mainImage, ...supportingImages] = files;

    const vehicleData = {
      make,
      model,
      year,
      vin,
      bodyType,
      fuelType,
      transmission,
      price,
      mileage,
      color,
      condition,
      lotNumber,
      description,
      features: features
        ? Array.isArray(features)
          ? features
          : String(features)
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
        : [],
      mainImage: mainImage || null,
      supportingImages,
      zipCode,
      address,
      state,
      city,
      createdBy: req.user._id, // Admin who added it
    };

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add vehicle",
    });
  }
};

/**
 * @desc Get all vehicles
 * @route GET /api/vehicles
 * @access Public
 */
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("createdBy", "name email accountType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
    });
  }
};

/**
 * @desc Get single vehicle
 * @route GET /api/vehicles/:id
 * @access Public
 */
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("createdBy", "name email");

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
    });
  }
};

/**
 * @desc Update vehicle (Admin only)
 * @route PUT /api/vehicles/:id
 * @access Private (admin)
 */
export const updateVehicle = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can update vehicles" });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // Update fields
    Object.assign(vehicle, req.body);

    // Handle new images
    const files = ["image1", "image2", "image3", "image4"]
      .map((field) => req.files?.[field]?.[0]?.path)
      .filter(Boolean);

    if (files.length) {
      const [mainImage, ...supportingImages] = files;
      vehicle.mainImage = mainImage || vehicle.mainImage;
      vehicle.supportingImages = [...vehicle.supportingImages, ...supportingImages];
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
    });
  }
};

/**
 * @desc Delete vehicle (Admin only)
 * @route DELETE /api/vehicles/:id
 * @access Private (admin)
 */
export const deleteVehicle = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can delete vehicles" });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
    });
  }
};
