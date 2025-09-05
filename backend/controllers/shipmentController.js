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
export const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const vehicle = await Vehicle.findOne({ "shipment.trackingNumber": trackingNumber });
    if (!vehicle || !vehicle.shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    res.json({
      success: true,
      shipment: vehicle.shipment,
      vehicleId: vehicle._id,
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
    const { status } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || !vehicle.shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    vehicle.shipment.shippingStatus = status;
    await vehicle.save();

    res.json({ success: true, message: "Shipment status updated", vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
