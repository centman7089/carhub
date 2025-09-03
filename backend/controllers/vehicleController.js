// controllers/vehicleController.js
import Vehicle from "../models/vehicle.js";

/**
 * @desc Add a new vehicle (Admin only)
 * @route POST /api/vehicles
 * @access Private (admin)
 */// controllers/vehicleController.js


// controllers/vehicleController.js


export const addVehicle = async (req, res) => {
  try {
    // if (req.user.accountType !== "admin") {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Only admins can add vehicles" });
    // }

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

    // ✅ Extract Cloudinary URLs directly from multer-storage-cloudinary
    const image1 = req.files?.image1 ? req.files.image1[0].path : null;
    const image2 = req.files?.image2 ? req.files.image2[0].path : null;
    const image3 = req.files?.image3 ? req.files.image3[0].path : null;
    const image4 = req.files?.image4 ? req.files.image4[0].path : null;

    const images = [image1, image2, image3, image4].filter(Boolean);

    const [mainImage, ...supportingImages] = images;

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
      // createdBy: req.admin._id, // Admin ID
    };

    const vehicle = await Vehicle.create(vehicleData);

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return res.status(500).json({
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
// controllers/vehicleController.js


export const updateVehicle = async (req, res) => {
  try {
    // if (req.user.accountType !== "admin") {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Only admins can update vehicles" });
    // }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    // ✅ Update text fields
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

    Object.assign(vehicle, {
      make: make ?? vehicle.make,
      model: model ?? vehicle.model,
      year: year ?? vehicle.year,
      vin: vin ?? vehicle.vin,
      bodyType: bodyType ?? vehicle.bodyType,
      fuelType: fuelType ?? vehicle.fuelType,
      transmission: transmission ?? vehicle.transmission,
      price: price ?? vehicle.price,
      mileage: mileage ?? vehicle.mileage,
      color: color ?? vehicle.color,
      condition: condition ?? vehicle.condition,
      lotNumber: lotNumber ?? vehicle.lotNumber,
      description: description ?? vehicle.description,
      features: features
        ? Array.isArray(features)
          ? features
          : String(features)
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
        : vehicle.features,
      zipCode: zipCode ?? vehicle.zipCode,
      address: address ?? vehicle.address,
      state: state ?? vehicle.state,
      city: city ?? vehicle.city,
    });

    // ✅ Handle new images from Cloudinary via Multer
    const image1 = req.files?.image1 ? req.files.image1[0].path : null;
    const image2 = req.files?.image2 ? req.files.image2[0].path : null;
    const image3 = req.files?.image3 ? req.files.image3[0].path : null;
    const image4 = req.files?.image4 ? req.files.image4[0].path : null;

    const newImages = [image1, image2, image3, image4].filter(Boolean);

    if (newImages.length > 0) {
      // Replace mainImage if provided
      vehicle.mainImage = newImages[0] || vehicle.mainImage;

      // Append supporting images
      vehicle.supportingImages = [
        ...vehicle.supportingImages,
        ...newImages.slice(1),
      ];
    }

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update vehicle",
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
    // if (req.user.accountType !== "admin") {
    //   return res.status(403).json({ success: false, message: "Only admins can delete vehicles" });
    // }

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
