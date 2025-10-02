// @ts-nocheck
import Vehicle from "../models/Vehicle.js";
import { Parser } from "json2csv";
import Category from "../models/categoryModel.js";
import BodyType from "../models/bodytypeModel.js";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
/**
 * @desc Add a new vehicle (Admin only)
 * @route POST /api/vehicles
 * @access Private (admin)
 */// controllers/vehicleController.js


// controllers/vehicleController.js

// ✅ Add Vehicle (Admin only, Category by name)
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
      bodyType, // bodyType NAME
      fuelType,
      transmission,
      price,
      mileage,
      color,
      condition,
      lotNumber,
      // category, // category NAME
      description,
      features,
      zipCode,
      address,
      state,
      city,
      priority,
    } = req.body;

    // ✅ Find category by name
    // const categoryDoc = await Category.findOne({ name: category });
    // if (!categoryDoc) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: `Category '${category}' not found` });
    // }

    // ✅ Find bodyType by name
    const bodyTypeDoc = await BodyType.findOne({ name: bodyType });
    if (!bodyTypeDoc) {
      return res
        .status(400)
        .json({ success: false, message: `BodyType '${bodyType}' not found` });
    }

    // ✅ Handle images (Cloudinary / multer-storage-cloudinary)
    const image1 = req.files?.image1 ? req.files.image1[0].path : null;
    const image2 = req.files?.image2 ? req.files.image2[0].path : null;
    const image3 = req.files?.image3 ? req.files.image3[0].path : null;
    const image4 = req.files?.image4 ? req.files.image4[0].path : null;

    const images = [image1, image2, image3, image4].filter(Boolean);
    const [mainImage, ...supportingImages] = images;

    // ✅ Create Vehicle
    const vehicle = await Vehicle.create({
      make,
      model,
      year,
      vin,
      bodyType: bodyTypeDoc._id, // store ObjectId
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
          : String(features).split(",").map((f) => f.trim())
        : [],
      mainImage: mainImage || null,
      supportingImages,
      // category: categoryDoc._id, // store ObjectId
      zipCode,
      address,
      state,
      city,
      priority,
      createdBy: req.admin.id,
    });

    // ✅ Populate category + bodyType names
    const populatedVehicle = await Vehicle.findById( vehicle._id )
      .populate( "bodyType", "name" );
      //  .populate("category", "name");

    return res
      .status(201)
      .json({ success: true, vehicle: populatedVehicle });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};





/**
 * @desc Get all vehicles
 * @route GET /api/vehicles
 * @access Public
 */



export const getAllVehicles = async (req, res) => {
  try {
    const { status, priority, sort } = req.query;

    // ✅ Build filter
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // ✅ Query with population
    let query = Vehicle.find(filter)
      // .populate("category", "name")
      .populate("bodyType", "name")
      .populate("createdBy", "firstName lastName email");

    // ✅ Sorting
    if (!sort || sort === "recent") {
      query = query.sort({ dateListed: -1 });
    } else if (sort === "views") {
      query = query.sort({ views: -1 });
    } else if (sort === "price") {
      query = query.sort({ price: -1 });
    }

    const vehicles = await query.exec();

    // ✅ Format response
    const formatted = vehicles.map((v) => ({
      id: v._id,
      title: `${v.year} ${v.make} ${v.model}`,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin || "",
      lotNumber: v.lotNumber || "",
      price: v.price,
      mileage: v.mileage,
      color: v.color,
      condition: v.condition || "",
      fuelType: v.fuelType || "",
      transmission: v.transmission || "",
      location: `${v.city}, ${v.state}, ${v.zipCode || ""}`,
      saleDate: v.dateListed,
      performance: {
        views: v.views || 0,
        interested: v.interested?.length || 0,
      },
      priority: v.priority || "Low",
      status: v.status || "Inactive",
      // category: v.category?.name || "Uncategorized",
      bodyType: v.bodyType?.name || "Unspecified",
      description: v.description || "",
      features: v.features?.length ? v.features : [],
      mainImage: v.mainImage || "",
      supportingImages: v.supportingImages?.length ? v.supportingImages : [],
      createdBy: v.createdBy || {},
    }));

    res.json({
      success: true,
      count: formatted.length,
      vehicles: formatted,
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
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
    const { vehicleId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId)
      .populate("bodyType", "name")
      .populate("createdBy", "firstName lastName email");

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    console.error("❌ Error fetching vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
      error: error.message,
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
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const {
      make,
      model,
      year,
      vin,
      bodyType, // bodyType NAME
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
      // category, // category NAME
    } = req.body;

    // // ✅ Handle category update by name (optional)
    // if (category) {
    //   const categoryDoc = await Category.findOne({ name: category });
    //   if (!categoryDoc) {
    //     return res.status(400).json({
    //       success: false,
    //       message: `Category '${category}' not found`,
    //     });
    //   }
    //   vehicle.category = categoryDoc._id;
    // }

    // ✅ Handle bodyType update by name (optional)
    if (bodyType) {
      const bodyTypeDoc = await BodyType.findOne({ name: bodyType });
      if (!bodyTypeDoc) {
        return res.status(400).json({
          success: false,
          message: `BodyType '${bodyType}' not found`,
        });
      }
      vehicle.bodyType = bodyTypeDoc._id;
    }

    // ✅ Update simple fields
    vehicle.make = make ?? vehicle.make;
    vehicle.model = model ?? vehicle.model;
    vehicle.year = year ?? vehicle.year;
    vehicle.vin = vin ?? vehicle.vin;
    vehicle.fuelType = fuelType ?? vehicle.fuelType;
    vehicle.transmission = transmission ?? vehicle.transmission;
    vehicle.price = price ?? vehicle.price;
    vehicle.mileage = mileage ?? vehicle.mileage;
    vehicle.color = color ?? vehicle.color;
    vehicle.condition = condition ?? vehicle.condition;
    vehicle.lotNumber = lotNumber ?? vehicle.lotNumber;
    vehicle.description = description ?? vehicle.description;
    vehicle.zipCode = zipCode ?? vehicle.zipCode;
    vehicle.address = address ?? vehicle.address;
    vehicle.state = state ?? vehicle.state;
    vehicle.city = city ?? vehicle.city;
    vehicle.priority = priority ?? vehicle.priority;

    // ✅ Handle features
    if (features) {
      vehicle.features = Array.isArray(features)
        ? features
        : String(features)
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
    }

    // ✅ Handle images (Cloudinary / multer)
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

    // ✅ Populate category + bodyType names in response
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      // .populate("category", "name")
      .populate("bodyType", "name")
      .populate("createdBy", "firstName lastName email");

    // ✅ Format response
    const formattedVehicle = {
      id: populatedVehicle._id,
      title: `${populatedVehicle.year} ${populatedVehicle.make} ${populatedVehicle.model}`,
      make: populatedVehicle.make || "",
      model: populatedVehicle.model || "",
      year: populatedVehicle.year || "",
      vin: populatedVehicle.vin || "",
      bodyType: populatedVehicle.bodyType?.name || "",
      fuelType: populatedVehicle.fuelType || "",
      transmission: populatedVehicle.transmission || "",
      price: populatedVehicle.price || "",
      mileage: populatedVehicle.mileage || "",
      color: populatedVehicle.color || "",
      condition: populatedVehicle.condition || "",
      lotNumber: populatedVehicle.lotNumber || "",
      description: populatedVehicle.description || "",
      features: populatedVehicle.features?.length
        ? populatedVehicle.features
        : [],
      location: {
        address: populatedVehicle.address || "",
        city: populatedVehicle.city || "",
        state: populatedVehicle.state || "",
        zipCode: populatedVehicle.zipCode || "",
      },
      priority: populatedVehicle.priority || "",
      // category: populatedVehicle.category?.name || "",
      mainImage: populatedVehicle.mainImage || "",
      supportingImages: populatedVehicle.supportingImages || [],
      createdBy: populatedVehicle.createdBy || {},
      createdAt: populatedVehicle.createdAt,
      updatedAt: populatedVehicle.updatedAt,
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
    const { id } = req.params;

    // ✅ Find vehicle
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // ✅ Delete vehicle
    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Vehicle '${vehicle.make} ${vehicle.model}' deleted successfully`,
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete vehicle",
    });
  }
};



// ================== CSV EXPORT ==================
export const exportVehiclesCSV = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("category", "name")
      .populate("bodyType", "name")
      .populate("createdBy", "firstName lastName email");

    if (!vehicles.length) {
      return res.status(404).json({ success: false, message: "No vehicles found" });
    }

    const fields = [
      { label: "Vehicle ID", value: "_id" },
      { label: "Make", value: "make" },
      { label: "Model", value: "model" },
      { label: "Year", value: "year" },
      { label: "Price", value: "price" },
      { label: "VIN", value: "vin" },
      { label: "Lot Number", value: "lotNumber" },
      { label: "Condition", value: "condition" },
      { label: "Mileage", value: "mileage" },
      { label: "Color", value: "color" },
      { label: "Fuel Type", value: "fuelType" },
      { label: "Transmission", value: "transmission" },
      // { label: "Category", value: (row) => row.category?.name || "" },
      { label: "Body Type", value: (row) => row.bodyType?.name || "" },
      { label: "Priority", value: "priority" },
      { label: "Status", value: "status" },
      { label: "Location", value: (row) => `${row.city || ""}, ${row.state || ""}, ${row.zipCode || ""}` },
      { label: "Created By", value: (row) => row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : "" },
      { label: "Created At", value: (row) => row.createdAt?.toISOString() || "" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(vehicles);

    res.header("Content-Type", "text/csv");
    res.attachment(`vehicles_export_${Date.now()}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error("Error exporting CSV:", error);
    return res.status(500).json({ success: false, message: "Failed to export CSV", error: error.message });
  }
};

// ================== EXCEL EXPORT ==================
export const exportVehiclesExcel = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      // .populate("category", "name")
      .populate("bodyType", "name")
      .populate("createdBy", "firstName lastName email");

    if (!vehicles.length) {
      return res.status(404).json({ success: false, message: "No vehicles found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vehicles");

    // ✅ Define headers
    worksheet.columns = [
      { header: "Vehicle ID", key: "_id", width: 25 },
      { header: "Make", key: "make", width: 15 },
      { header: "Model", key: "model", width: 15 },
      { header: "Year", key: "year", width: 10 },
      { header: "Price", key: "price", width: 15 },
      { header: "VIN", key: "vin", width: 20 },
      { header: "Lot Number", key: "lotNumber", width: 20 },
      { header: "Condition", key: "condition", width: 15 },
      { header: "Mileage", key: "mileage", width: 15 },
      { header: "Color", key: "color", width: 15 },
      { header: "Fuel Type", key: "fuelType", width: 15 },
      { header: "Transmission", key: "transmission", width: 15 },
      // { header: "Category", key: "category", width: 15 },
      { header: "Body Type", key: "bodyType", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Location", key: "location", width: 25 },
      { header: "Created By", key: "createdBy", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // ✅ Add rows
    vehicles.forEach((v) => {
      worksheet.addRow({
        _id: v._id.toString(),
        make: v.make,
        model: v.model,
        year: v.year,
        price: v.price,
        vin: v.vin,
        lotNumber: v.lotNumber,
        condition: v.condition,
        mileage: v.mileage,
        color: v.color,
        fuelType: v.fuelType,
        transmission: v.transmission,
        // category: v.category?.name || "",
        bodyType: v.bodyType?.name || "",
        priority: v.priority,
        status: v.status,
        location: `${v.city || ""}, ${v.state || ""}, ${v.zipCode || ""}`,
        createdBy: v.createdBy ? `${v.createdBy.firstName} ${v.createdBy.lastName}` : "",
        createdAt: v.createdAt?.toISOString() || "",
      });
    });

    // ✅ Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=vehicles_export_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error exporting Excel:", error);
    return res.status(500).json({ success: false, message: "Failed to export Excel", error: error.message });
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



export const getVehiclesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Capitalize properly (SUV stays uppercase)
    const normalizedCategory =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

    const vehicles = await Vehicle.find({ category: normalizedCategory });

    return res.status(200).json({
      success: true,
      category: normalizedCategory,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles by category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles by category",
    });
  }
};


//Fetch Vehicle Category to display in the frontend
export const getCategoriesFromVehicles = async ( req, res ) =>
{
  try {
    const categories = await Vehicle.distinct("category");
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};


// export const searchVehicles = async (req, res) => {
//   try {
//     const {
//       make,
//       model,
//       minPrice,
//       maxPrice,
//       condition,
//       bodyType,
//       fuelType,
//       transmission,
//       minYear,
//       maxYear,
//     } = req.query;

//     const orConditions = [];
//     const andConditions = [];

//     // --- OR filters ---

//     if (make && make !== "Any") {
//       orConditions.push({ make: { $regex: new RegExp(make, "i") } });
//     }

//     if (model && model !== "Any") {
//       orConditions.push({ model: { $regex: new RegExp(model, "i") } });
//     }

//     if (condition && condition !== "All") {
//       orConditions.push({ condition: { $regex: new RegExp(condition, "i") } });
//     }

//     if (bodyType && bodyType !== "All") {
//       const bodyTypeDocs = await BodyType.find({
//         name: { $regex: new RegExp(bodyType, "i") },
//       }).select("_id");

//       if (bodyTypeDocs.length > 0) {
//         orConditions.push({ bodyType: { $in: bodyTypeDocs.map((b) => b._id) } });
//       }
//     }

//     if (fuelType && fuelType !== "All") {
//       orConditions.push({ fuelType: { $regex: new RegExp(fuelType, "i") } });
//     }

//     if (transmission && transmission !== "All") {
//       orConditions.push({ transmission: { $regex: new RegExp(transmission, "i") } });
//     }

//     // --- AND filters (always applied) ---

//     if (minPrice || maxPrice) {
//       const priceFilter = {};
//       if (minPrice) priceFilter.$gte = Number(minPrice);
//       if (maxPrice) priceFilter.$lte = Number(maxPrice);
//       andConditions.push({ price: priceFilter });
//     }

//     if (minYear || maxYear) {
//       const yearFilter = {};
//       if (minYear) yearFilter.$gte = Number(minYear);
//       if (maxYear) yearFilter.$lte = Number(maxYear);
//       andConditions.push({ year: yearFilter });
//     }

//     // --- Final filter ---
//     let filter = {};
//     if (orConditions.length > 0 && andConditions.length > 0) {
//       filter = { $and: [ { $or: orConditions }, ...andConditions ] };
//     } else if (orConditions.length > 0) {
//       filter = { $or: orConditions };
//     } else if (andConditions.length > 0) {
//       filter = { $and: andConditions };
//     }

//     // console.log("🔍 Final filter:", JSON.stringify(filter, null, 2));

//     const vehicles = await Vehicle.find(filter)
//       .populate("bodyType", "name")
//       .populate("createdBy", "firstName lastName email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: vehicles.length,
//       vehicles,
//     });
//   } catch (error) {
//     console.error("❌ Error searching vehicles:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to search vehicles",
//       error: error.message,
//     });
//   }
// };
export const searchVehicles = async (req, res) => {
  try {
    const {
      make,
      model,
      minPrice,
      maxPrice,
      condition,
      bodyType,
      fuelType,
      transmission,
      minYear,
      maxYear,
    } = req.query;

    const orConditions = [];
    const andConditions = [];

    // --- OR filters ---

    if (make && make !== "Any") {
      orConditions.push({ make: { $regex: new RegExp(make, "i") } });
    }

    if (model && model !== "Any") {
      orConditions.push({ model: { $regex: new RegExp(model, "i") } });
    }

    if (condition && condition !== "All") {
      orConditions.push({ condition: { $regex: new RegExp(condition, "i") } });
    }

    if (bodyType && bodyType !== "All") {
      const bodyTypeDocs = await BodyType.find({
        name: { $regex: new RegExp(bodyType, "i") },
      }).select("_id");

      if (bodyTypeDocs.length > 0) {
        orConditions.push({ bodyType: { $in: bodyTypeDocs.map((b) => b._id) } });
      }
    }

    if (fuelType && fuelType !== "All") {
      orConditions.push({ fuelType: { $regex: new RegExp(fuelType, "i") } });
    }

    if (transmission && transmission !== "All") {
      orConditions.push({ transmission: { $regex: new RegExp(transmission, "i") } });
    }

    // --- AND filters (always applied) ---

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      andConditions.push({ price: priceFilter });
    }

    if (minYear || maxYear) {
      const yearFilter = {};
      if (minYear) yearFilter.$gte = Number(minYear);
      if (maxYear) yearFilter.$lte = Number(maxYear);
      andConditions.push({ year: yearFilter });
    }

    // --- Final filter ---
    let filter = {};
    if (orConditions.length > 0 && andConditions.length > 0) {
      filter = { $and: [{ $or: orConditions }, ...andConditions] };
    } else if (orConditions.length > 0) {
      filter = { $or: orConditions };
    } else if (andConditions.length > 0) {
      filter = { $and: andConditions };
    }

    console.log("🔍 Final filter:", JSON.stringify(filter, null, 2));

    const vehicles = await Vehicle.find(filter)
      .populate("bodyType", "name")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("❌ Error searching vehicles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search vehicles",
      error: error.message,
    });
  }
};





export const getVehiclesByBodyType = async (req, res) => {
  try {
    const { name } = req.params;
    const bodyType = await BodyType.findOne({ name });
    if (!bodyType) return res.status(404).json({ message: "BodyType not found" });

    const vehicles = await Vehicle.find({ bodyType: bodyType._id })
      .populate("bodyType", "name")
      // .populate("category", "name");

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getVehiclesCategory = async (req, res) => {
  try {
    const { name } = req.params;
    const category = await Category.findOne({ name });
    if (!category) return res.status(404).json({ message: "Category not found" });

    const vehicles = await Vehicle.find({ category: category._id })
      .populate("bodyType", "name")
      .populate("category", "name");

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

