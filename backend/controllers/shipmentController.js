// @ts-nocheck
import Vehicle from "../models/Vehicle.js";
import { generateTrackingNumber } from "../utils/generateTrackingNumber.js";

export const createShipment = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const {
      carrierCompany,
      pickupDate,
      deliveryDate,
      expectedDelivery,
      pickupStreet,
      pickupCity,
      pickupState,
      pickupZip,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryZip,
      shippingCost,
      insuranceValue,
      priorityLevel,
      specialInstructions,
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const trackingNumber = generateTrackingNumber();

    vehicle.shipment = {
      trackingNumber,
      carrierCompany,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      pickupAddress: {
        street: pickupStreet,
        city: pickupCity,
        state: pickupState,
        zipCode: pickupZip,
      },
      deliveryAddress: {
        street: deliveryStreet,
        city: deliveryCity,
        state: deliveryState,
        zipCode: deliveryZip,
      },
      shippingCost,
      insuranceValue,
      priorityLevel,
      specialInstructions,
      shippingStatus: "Pending",
    };

    await vehicle.save();

    res.json({
      success: true,
      message: "Shipment created",
      trackingNumber,
      shipment: vehicle.shipment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateShipment = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const {
      carrierCompany,
      pickupDate,
      deliveryDate,
      expectedDelivery,
      pickupStreet,
      pickupCity,
      pickupState,
      pickupZip,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryZip,
      shippingCost,
      insuranceValue,
      priorityLevel,
      specialInstructions,
      shippingStatus,
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || !vehicle.shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    Object.assign(vehicle.shipment, {
      carrierCompany: carrierCompany ?? vehicle.shipment.carrierCompany,
      pickupDate: pickupDate ? new Date(pickupDate) : vehicle.shipment.pickupDate,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : vehicle.shipment.deliveryDate,
      expectedDelivery: expectedDelivery
        ? new Date(expectedDelivery)
        : vehicle.shipment.expectedDelivery,
      pickupAddress: {
        street: pickupStreet ?? vehicle.shipment.pickupAddress.street,
        city: pickupCity ?? vehicle.shipment.pickupAddress.city,
        state: pickupState ?? vehicle.shipment.pickupAddress.state,
        zipCode: pickupZip ?? vehicle.shipment.pickupAddress.zipCode,
      },
      deliveryAddress: {
        street: deliveryStreet ?? vehicle.shipment.deliveryAddress.street,
        city: deliveryCity ?? vehicle.shipment.deliveryAddress.city,
        state: deliveryState ?? vehicle.shipment.deliveryAddress.state,
        zipCode: deliveryZip ?? vehicle.shipment.deliveryAddress.zipCode,
      },
      shippingCost: shippingCost ?? vehicle.shipment.shippingCost,
      insuranceValue: insuranceValue ?? vehicle.shipment.insuranceValue,
      priorityLevel: priorityLevel ?? vehicle.shipment.priorityLevel,
      specialInstructions: specialInstructions ?? vehicle.shipment.specialInstructions,
      shippingStatus: shippingStatus ?? vehicle.shipment.shippingStatus,
    });

    await vehicle.save();

    res.json({ success: true, message: "Shipment updated", shipment: vehicle.shipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 Track Shipment by Tracking Number

// export const trackShipment = async (req, res) => {
//   try {
//     const { trackingNumber } = req.params;

//     // 🔎 Find vehicle with shipment tracking number
//     const vehicle = await Vehicle.findOne({ "shipment.trackingNumber": trackingNumber })
//       .populate("createdBy", "firstName lastName email");

//     if (!vehicle || !vehicle.shipment) {
//       return res.status(404).json({ success: false, message: "Shipment not found" });
//     }

//     const shipment = vehicle.shipment;

//     // 🛠 Format the response like your Shipping Progress UI
//     const response = {
//       success: true,
//       vehicleId: vehicle._id,
//       vehicleDetails: {
//         lotNumber: shipment.lotNumber || null,
//         make: vehicle.make,
//         model: vehicle.model,
//         year: vehicle.year,
//         vin: vehicle.vin,
//         image: vehicle.images?.[0] || null,
//       },
//       shipment: {
//         trackingNumber: shipment.trackingNumber,
//         status: shipment.status, // e.g. "Loaded on Vessel", "Delivered", "Drop Off"
//         estDelivery: shipment.estDelivery || null,
//         progress: shipment.progress || 0, // percentage
//         courier: shipment.courier || null,
//         driver: shipment.driver || null,
//         action: shipment.action || null, // e.g. "Track", "Completed", "Title Pending"
//       },
//     };

//     res.json(response);
//   } catch (err) {
//     console.error("❌ Error tracking shipment:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const trackShipment = async ( req, res ) =>
{
  try
  {
    const { trackingNumber } = req.params;
    const vehicle = await Vehicle.findOne( { "shipment.trackingNumber": trackingNumber } );
    if ( !vehicle || !vehicle.shipment )
    {
      return res.status( 404 ).json( { success: false, message: "Shipment not found" } );
    }
    res.json( { success: true, shipment: vehicle.shipment, vehicleId: vehicle._id, vehicleDetails: { make: vehicle.make, model: vehicle.model, year: vehicle.year, vin: vehicle.vin, }, } );
  } catch ( err ) { res.status( 500 ).json( { success: false, message: err.message } ); }
};

// export const trackShipment = async (req, res) => {
//   try {
//     const { trackingNumber } = req.params;

//     // 🔎 Find vehicle with this tracking number
//     const vehicle = await Vehicle.findOne({
//       "shipment.trackingNumber": trackingNumber,
//     }).populate("createdBy", "firstName lastName email role");

//     if (!vehicle || !vehicle.shipment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Shipment not found" });
//     }

//     // ✅ Restrict access inside controller too (extra safety)
//     // if (
//     //   req.admin.role !== "admin" &&
//     //   req.admin.role !== "superadmin" &&
//     //   vehicle.createdBy._id.toString() !== req.admin._id.toString()
//     // ) {
//     //   return res.status(403).json({
//     //     success: false,
//     //     message: "Unauthorized to track this shipment",
//     //   });
//     // }

//     const shipment = vehicle.shipment;

//     res.json({
//       success: true,
//       vehicleId: vehicle._id,
//       vehicleDetails: {
//         lotNumber: shipment.lotNumber || null,
//         make: vehicle.make,
//         model: vehicle.model,
//         year: vehicle.year,
//         vin: vehicle.vin,
//         image: vehicle.mainImage || vehicle.images?.[0] || null,
//       },
//       shipment: {
//         trackingNumber: shipment.trackingNumber,
//         status: shipment.status,
//         estDelivery: shipment.estDelivery || null,
//         progress: shipment.progress || 0,
//         courier: shipment.courier || null,
//         driver: shipment.driver || null,
//         action: shipment.action || null,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Error tracking shipment:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// 🔹 Get All Shipments
// export const getAllShipments = async (req, res) => {
//   try {
//     const vehicles = await Vehicle.find({ "shipment.trackingNumber": { $exists: true } });

//     const shipments = vehicles.map(v => ({
//       vehicleId: v._id,
//       vehicleDetails: {
//         make: v.make,
//         model: v.model,
//         year: v.year,
//         vin: v.vin,
//       },
//       shipment: v.shipment,
//     }));

//     res.json({ success: true, count: shipments.length, shipments });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const getAllShipments = async (req, res) => {
  try {
    // ✅ Find only vehicles that have a shipment and sort by last updated
    const vehicles = await Vehicle.find({
      "shipment.trackingNumber": { $exists: true },
    }).sort({ updatedAt: -1 }); // most recent first

    const shipments = vehicles.map((v) => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
      },
      shipment: v.shipment,
      lastUpdated: v.updatedAt, // helpful for frontend
    }));

    res.json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 Get Shipment By Vehicle ID
export const getShipmentById = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || !vehicle.shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    res.json({
      success: true,
      shipment: vehicle.shipment,
      vehicleDetails: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ✅ Update shipment status (e.g. mark delivered)
export const updateShipmentStatus = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    // ✅ Normalize case (capitalize first letter, rest lowercase OR all uppercase)
    // Example: "pending" -> "Pending"
    status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const vehicle = await Vehicle.findById(vehicleId).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!vehicle || !vehicle.shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    vehicle.shipment.shippingStatus = status;
    vehicle.markModified("shipment"); // ensure mongoose tracks changes

    await vehicle.save();

    res.json({
      success: true,
      message: "Shipment status updated",
      vehicle: {
        vehicleId: vehicle._id,
        vehicleDetails: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          image: vehicle.images?.[0] || null,
          price: vehicle.price || 0,
          status: vehicle.status,
        },
        shipment: vehicle.shipment,
        createdBy: vehicle.createdBy, // dealer info
      },
    });
  } catch (err) {
    console.error("❌ Error in updateShipmentStatus:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// export const updateShipmentStatus = async (req, res) => {
//   try {
//     const { vehicleId } = req.params;
//     const { status } = req.body;

//     if (!status) {
//       return res.status(400).json({ success: false, message: "Status is required" });
//     }

//     const vehicle = await Vehicle.findById(vehicleId);
//     if (!vehicle || !vehicle.shipment) {
//       return res.status(404).json({ success: false, message: "Shipment not found" });
//     }

//     // ✅ use correct field (match your schema!)
//     vehicle.shipment.shippingStatus = status;

//     // ✅ ensure Mongoose tracks change
//     vehicle.markModified("shipment");

//     await vehicle.save();

//     res.json({
//       success: true,
//       message: "Shipment status updated",
//       shipment: vehicle.shipment, // return only shipment instead of whole vehicle
//     });
//   } catch (err) {
//     console.error("❌ Error in updateShipmentStatus:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



export const getActiveShipments = async (req, res) => {
  try {
    const { status, from, to } = req.query; // ✅ support status + date range

    const filter = { shipment: { $exists: true } };

    // ✅ Handle status (single or multiple, case-insensitive)
    if (status && status !== "All") {
      const statusArray = status.split(",").map((s) => s.trim());
      filter["shipment.shippingStatus"] = {
        $in: statusArray.map((s) => new RegExp(`^${s}$`, "i")),
      };
    }

    // ✅ Handle Date Range (by pickupDate or deliveryDate)
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);

      // You can choose which date to filter on → pickupDate or deliveryDate
      filter["shipment.pickupDate"] = dateFilter;
      // OR: filter["shipment.deliveryDate"] = dateFilter;
    }

    const vehicles = await Vehicle.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ "shipment.updatedAt": -1 });

    const shipments = vehicles.map((v) => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
        image: v.images?.[0] || null,
        price: v.price || 0,
      },
      shipment: v.shipment,
    }));

    // ✅ Summary Stats
    const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);

    const statusCounts = vehicles.reduce((acc, v) => {
      const s = v.shipment?.shippingStatus || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: shipments.length,
      shipments,
      summary: {
        totalValue,
        statusCounts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getDealerShipments = async (req, res) => {
  try {
    const dealerId = req.params.dealerId; // Dealer ID from route /:dealerId

    // Find all active vehicles created by this dealer with a shipment
    const vehicles = await Vehicle.find({
      createdBy: dealerId,
      status: "Active",
      shipment: { $exists: true }
    })
      .select("make model year price mainImage shipment")
      .lean();

    if (!vehicles || vehicles.length === 0) {
      return res.json({
        success: true,
        count: 0,
        shipments: [],
        summary: {
          totalValue: 0,
          statusCounts: {
            Pending: 0,
            "Vessel In Transit": 0,
            Delivered: 0,
          }
        }
      });
    }

    // Build shipments response
    const shipments = vehicles.map((v) => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        price: v.price,
        image: v.mainImage || null,
      },
      shipment: v.shipment,
    }));

    // Compute summary
    const totalValue = vehicles.reduce((acc, v) => acc + (v.price || 0), 0);

    const statusCounts = vehicles.reduce((acc, v) => {
      const status = v.shipment?.shippingStatus || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: shipments.length,
      shipments,
      summary: {
        totalValue,
        statusCounts
      }
    });

  } catch (err) {
    console.error("❌ Error in getDealerShipments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// export const getDealerActiveShipments = async (req, res) => {
//   try {
//     const dealerId = req.dealer._id; // ✅ from auth middleware (logged-in dealer)
//     const { status, from, to, trackingNumber } = req.query;

//     const filter = {
//       createdBy: dealerId, // ✅ only show shipments for this dealer
//       status: "Active",    // ✅ only active vehicle listings
//       shipment: { $exists: true },
//     };

//     // ✅ Filter by status (case-insensitive)
//     if (status && status !== "All") {
//       const statusArray = status.split(",").map((s) => s.trim());
//       filter["shipment.shippingStatus"] = {
//         $in: statusArray.map((s) => new RegExp(`^${s}$`, "i")),
//       };
//     }

//     // ✅ Filter by tracking number (dealer tracks shipment by code)
//     if (trackingNumber) {
//       filter["shipment.trackingNumber"] = trackingNumber.trim();
//     }

//     // ✅ Handle Date Range (pickup or delivery)
//     if (from || to) {
//       const dateFilter = {};
//       if (from) dateFilter.$gte = new Date(from);
//       if (to) dateFilter.$lte = new Date(to);
//       filter["shipment.pickupDate"] = dateFilter;
//     }

//     const vehicles = await Vehicle.find(filter)
//       .populate("createdBy", "firstName lastName email")
//       .sort({ "shipment.updatedAt": -1 });

//     if (!vehicles || vehicles.length === 0) {
//       return res.json({
//         success: true,
//         count: 0,
//         shipments: [],
//         summary: {
//           totalValue: 0,
//           statusCounts: {},
//         },
//       });
//     }

//     // ✅ Map response
//     const shipments = vehicles.map((v) => ({
//       vehicleId: v._id,
//       vehicleDetails: {
//         make: v.make,
//         model: v.model,
//         year: v.year,
//         vin: v.vin,
//         image: v.mainImage || null,
//         price: v.price || 0,
//       },
//       shipment: v.shipment,
//     }));

//     // ✅ Summary stats
//     const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);

//     const statusCounts = vehicles.reduce((acc, v) => {
//       const s = v.shipment?.shippingStatus || "Unknown";
//       acc[s] = (acc[s] || 0) + 1;
//       return acc;
//     }, {});

//     res.json({
//       success: true,
//       count: shipments.length,
//       shipments,
//       summary: {
//         totalValue,
//         statusCounts,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Error in getDealerActiveShipments:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


export const getDealerActiveShipments = async (req, res) => {
  try {
    const { dealerId } = req.params; // ✅ dealerId from route
    const { status, from, to, trackingNumber } = req.query;

    const filter = {
      createdBy: dealerId, // ✅ filter by dealerId param
      status: "Active",
      shipment: { $exists: true },
    };

    // ✅ Status filter
    if (status && status !== "All") {
      const statusArray = status.split(",").map((s) => s.trim());
      filter["shipment.shippingStatus"] = {
        $in: statusArray.map((s) => new RegExp(`^${s}$`, "i")),
      };
    }

    // ✅ Tracking number filter
    if (trackingNumber) {
      filter["shipment.trackingNumber"] = trackingNumber.trim();
    }

    // ✅ Date range filter
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter["shipment.pickupDate"] = dateFilter;
    }

    const vehicles = await Vehicle.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ "shipment.updatedAt": -1 });

    if (!vehicles.length) {
      return res.json({
        success: true,
        count: 0,
        shipments: [],
        summary: { totalValue: 0, statusCounts: {} },
      });
    }

    // ✅ Format shipments
    const shipments = vehicles.map((v) => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
        image: v.mainImage || null,
        price: v.price || 0,
      },
      shipment: v.shipment,
    }));

    // ✅ Summary stats
    const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);
    const statusCounts = vehicles.reduce((acc, v) => {
      const s = v.shipment?.shippingStatus || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: shipments.length,
      shipments,
      summary: { totalValue, statusCounts },
    });
  } catch (err) {
    console.error("❌ Error in getDealerActiveShipments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getUserActiveShipments = async (req, res) => {
  try {
    const { userId } = req.params; // ✅ userId from route
    const { status, from, to, trackingNumber } = req.query;

    const filter = {
      createdBy: userId, // ✅ filter by userId param
      status: "Active",
      shipment: { $exists: true },
    };

    // ✅ Status filter
    if (status && status !== "All") {
      const statusArray = status.split(",").map((s) => s.trim());
      filter["shipment.shippingStatus"] = {
        $in: statusArray.map((s) => new RegExp(`^${s}$`, "i")),
      };
    }

    // ✅ Tracking number filter
    if (trackingNumber) {
      filter["shipment.trackingNumber"] = trackingNumber.trim();
    }

    // ✅ Date range filter
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter["shipment.pickupDate"] = dateFilter;
    }

    const vehicles = await Vehicle.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ "shipment.updatedAt": -1 });

    if (!vehicles.length) {
      return res.json({
        success: true,
        count: 0,
        shipments: [],
        summary: { totalValue: 0, statusCounts: {} },
      });
    }

    // ✅ Format shipments
    const shipments = vehicles.map((v) => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
        image: v.mainImage || null,
        price: v.price || 0,
      },
      shipment: v.shipment,
    }));

    // ✅ Summary stats
    const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);
    const statusCounts = vehicles.reduce((acc, v) => {
      const s = v.shipment?.shippingStatus || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: shipments.length,
      shipments,
      summary: { totalValue, statusCounts },
    });
  } catch (err) {
    console.error("❌ Error in getDealerActiveShipments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDealerOrders = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { make, model, year, status, minPrice, maxPrice } = req.query;

    // 🛡️ Role-based restriction
    if (req.user.role !== "admin" && req.user._id.toString() !== dealerId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view these orders",
      });
    }

    // ✅ Build filter
    const filter = { createdBy: dealerId };

    if (make) filter.make = new RegExp(`^${make}$`, "i"); // case-insensitive exact
    if (model) filter.model = new RegExp(`^${model}$`, "i");
    if (year) filter.year = parseInt(year, 10);
    if (status && status !== "All") filter.status = status;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const vehicles = await Vehicle.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    // ✅ Format results
    const orders = vehicles.map((v) => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
        image: v.mainImage || null,
        price: v.price,
        status: v.status,
      },
      shipment: v.shipment || null,
    }));

    // ✅ Summary
    const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);
    const statusCounts = vehicles.reduce((acc, v) => {
      const s = v.status || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: orders.length,
      orders,
      summary: {
        totalValue,
        statusCounts,
      },
    });
  } catch (err) {
    console.error("❌ Error in getDealerOrders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};