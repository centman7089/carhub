import Vehicle from "../models/Vehicle.js";
import { Parser } from "json2csv";

/**
 * @desc Add a new vehicle (Admin only)
 * @route POST /api/vehicles
 * @access Private (admin)
 */// controllers/vehicleController.js


// controllers/vehicleController.js


// 
export const addVehicle = async (req, res) => {
  try {
    // ✅ Ensure only admins can add vehicles
    if (!req.admin || !req.admin.id) {
      return res
        .status(403)
        .json({ success: false, message: "Only admins can add vehicles" });
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
      priority, // ✅ added priority
    } = req.body;

    // ✅ Extract Cloudinary URLs directly from multer-storage-cloudinary
    const image1 = req.files?.image1 ? req.files.image1[0].path : null;
    const image2 = req.files?.image2 ? req.files.image2[0].path : null;
    const image3 = req.files?.image3 ? req.files.image3[0].path : null;
    const image4 = req.files?.image4 ? req.files.image4[0].path : null;

    const images = [image1, image2, image3, image4].filter(Boolean);
    const [mainImage, ...supportingImages] = images;

    // ✅ Create vehicle object
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
      priority: ["Low", "Medium", "High"].includes(priority) ? priority : "",
      createdBy: req.admin.id, // ✅ attach the admin who created it
    };

    const vehicle = await Vehicle.create(vehicleData);

    // ✅ Format response (ensure no null/undefined)
    const formattedVehicle = {
      ...vehicle.toObject(),
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      vin: vehicle.vin || "",
      bodyType: vehicle.bodyType || "",
      fuelType: vehicle.fuelType || "",
      transmission: vehicle.transmission || "",
      price: vehicle.price || "",
      mileage: vehicle.mileage || "",
      color: vehicle.color || "",
      condition: vehicle.condition || "",
      lotNumber: vehicle.lotNumber || "",
      description: vehicle.description || "",
      features: vehicle.features?.length ? vehicle.features : [],
      zipCode: vehicle.zipCode || "",
      address: vehicle.address || "",
      state: vehicle.state || "",
      city: vehicle.city || "",
      priority: vehicle.priority || "",
      mainImage: vehicle.mainImage || "",
      supportingImages: vehicle.supportingImages?.length
        ? vehicle.supportingImages
        : [],
      createdBy: vehicle.createdBy || "",
    };

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: formattedVehicle,
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
// ✅ Get all vehicles with filters
// export const getAllVehicles = async (req, res) => {
//   try {
//     const { status, priority, sort } = req.query;

//     let filter = {};
//     if (status) filter.status = status;
//     if (priority) filter.priority = priority;

//     let query = Vehicle.find(filter);

//     // Sorting (recent, price, views)
//     if (sort === "recent") query = query.sort({ dateListed: -1 });
//     if (sort === "views") query = query.sort({ views: -1 });
//     if (sort === "price") query = query.sort({ price: -1 });

//     const vehicles = await query.exec();

//     res.json({ success: true, count: vehicles.length, vehicles });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const getAllVehicles = async (req, res) => {
  try {
    const { status, priority, sort } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    let query = Vehicle.find(filter);

    // ✅ Default: recent first
    if (!sort || sort === "recent") {
      query = query.sort({ dateListed: -1 });
    } else if (sort === "views") {
      query = query.sort({ views: -1 });
    } else if (sort === "price") {
      query = query.sort({ price: -1 });
    }

    const vehicles = await query.exec();

    res.json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
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
    const vehicle = await Vehicle.findById( req.params.id );

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
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    // ✅ Destructure incoming fields
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
      priority,
    } = req.body;

    // ✅ Update fields only if provided, else keep existing
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
      priority: priority ?? vehicle.priority,
    });

    // ✅ Handle images (main + supporting)
    const image1 = req.files?.image1 ? req.files.image1[0].path : null;
    const image2 = req.files?.image2 ? req.files.image2[0].path : null;
    const image3 = req.files?.image3 ? req.files.image3[0].path : null;
    const image4 = req.files?.image4 ? req.files.image4[0].path : null;

    const newImages = [image1, image2, image3, image4].filter(Boolean);

    if (newImages.length > 0) {
      vehicle.mainImage = newImages[0] || vehicle.mainImage;
      vehicle.supportingImages = [
        ...vehicle.supportingImages,
        ...newImages.slice(1),
      ];
    }

    await vehicle.save();

    // ✅ Force all fields in response to string ("" if empty)
    const formattedVehicle = {
      ...vehicle.toObject(),
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      vin: vehicle.vin || "",
      bodyType: vehicle.bodyType || "",
      fuelType: vehicle.fuelType || "",
      transmission: vehicle.transmission || "",
      price: vehicle.price || "",
      mileage: vehicle.mileage || "",
      color: vehicle.color || "",
      condition: vehicle.condition || "",
      lotNumber: vehicle.lotNumber || "",
      description: vehicle.description || "",
      features: vehicle.features?.length ? vehicle.features : [],
      zipCode: vehicle.zipCode || "",
      address: vehicle.address || "",
      state: vehicle.state || "",
      city: vehicle.city || "",
      priority: vehicle.priority || "",
      mainImage: vehicle.mainImage || "",
      supportingImages: vehicle.supportingImages?.length
        ? vehicle.supportingImages
        : [],
    };

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: formattedVehicle,
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



export const exportVehiclesCSV = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();

    if (!vehicles.length) {
      return res.status(404).json({ message: "No vehicles found" });
    }

    // Pick fields to export
    const fields = [
      { label: "Vehicle ID", value: "_id" },
      { label: "Make", value: "make" },
      { label: "Model", value: "model" },
      { label: "Year", value: "year" },
      { label: "Price", value: "price" },
      { label: "Location (City)", value: "location.city" },
      { label: "Location (State)", value: "location.state" },
      { label: "Mileage", value: "mileage" },
      { label: "Priority", value: "priority" },
      { label: "Status", value: "status" },
      { label: "Created At", value: "createdAt" }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(vehicles);

    res.header("Content-Type", "text/csv");
    res.attachment("vehicles.csv");
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export vehicles", error: error.message });
  }
};

// Update vehicle priority (Admin only)
export const updateVehiclePriority = async (req, res) => {
  try {
    const { id } = req.params;        // Vehicle ID
    const { priority } = req.body;    // New priority (Low, Medium, High)

    if (!["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority value" });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    res.json({
      success: true,
      message: "Vehicle priority updated successfully",
      vehicle,
    });
  } catch (err) {
    console.error("Update priority error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// ⚠️ Delete ALL vehicles
export const deleteAllVehicles = async (req, res) => {
  try {
    // Optional: restrict only super admin
    if (req.admin?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete all vehicles",
      });
    }

    const result = await Vehicle.deleteMany({});
    res.json({
      success: true,
      message: `${result.deletedCount} vehicles deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

