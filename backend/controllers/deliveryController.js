// @ts-nocheck

import Delivery from '../models/Delivery.js';
// controllers/deliveryController.js
import Vehicle from "../models/Vehicle.js";
import { generateTrackingNumber } from "../utils/generateTrackingNumber.js";

// Create a new delivery
const createDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.create(req.body);
    res.status(201).json(delivery);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create delivery', error: err.message });
  }
};

// Get all deliveries
const getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find().populate('car user auction');
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch deliveries' });
  }
};

// Get single delivery
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('car user auction');
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch delivery' });
  }
};

// Update delivery
const updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update delivery', error: err.message });
  }
};

// Delete delivery
const deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete delivery' });
  }
};



// ✅ Add shipment info to a vehicle


// const createShipment = async (req, res) => {
//   try {
//     const { vehicleId } = req.params;

//     const {
//       carrierCompany,
//       expectedDelivery,
//       pickupAddress,
//       deliveryAddress,
//       shippingCost,
//       insuranceValue,
//       priorityLevel,
//       specialInstructions,
//     } = req.body;

//     const vehicle = await Vehicle.findById(vehicleId);
//     if (!vehicle) {
//       return res.status(404).json({ success: false, message: "Vehicle not found" });
//     }

//     const trackingNumber = generateTrackingNumber();

//     vehicle.shipment = {
//       trackingNumber, // auto-generated
//       carrierCompany,
//       expectedDelivery,
//       pickupAddress,
//       deliveryAddress,
//       shippingCost,
//       insuranceValue,
//       priorityLevel,
//       specialInstructions,
//       shippingStatus: "Pending",
//     };

//     await vehicle.save();

//     res.json({
//       success: true,
//       message: "Shipment created",
//       trackingNumber,
//       vehicle,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

const createShipment = async (req, res) => {
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

// ✅ Update shipment status (e.g. mark delivered)
//  const updateShipmentStatus = async (req, res) => {
//   try {
//     const { vehicleId } = req.params;
//     const { status } = req.body;

//     const vehicle = await Vehicle.findById(vehicleId);
//     if (!vehicle || !vehicle.shipment) {
//       return res.status(404).json({ success: false, message: "Shipment not found" });
//     }

//     vehicle.shipment.shippingStatus = status;
//     await vehicle.save();

//     res.json({ success: true, message: "Shipment status updated", vehicle });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

const updateShipment = async (req, res) => {
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


// ✅ Search shipment by tracking number
// const trackShipment = async (req, res) => {
//   try {
//     const { trackingNumber } = req.params;

//     const vehicle = await Vehicle.findOne({
//       "shipment.trackingNumber": trackingNumber,
//     });

//     if (!vehicle) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Shipment not found" });
//     }

//     res.json({
//       success: true,
//       trackingNumber,
//       shipment: vehicle.shipment,
//       vehicle: {
//         make: vehicle.make,
//         model: vehicle.model,
//         year: vehicle.year,
//         vin: vehicle.vin,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// @desc Get all shipments
// @route GET /api/shipments
// @access Private (admin or manager, depends on your auth)
// const getAllShipments = async (req, res) => {
//   try {
//     // Find vehicles that have shipment data
//     const vehicles = await Vehicle.find({ "shipment.trackingNumber": { $exists: true } });

//     if (!vehicles.length) {
//       return res.status(404).json({ success: false, message: "No shipments found" });
//     }

//     // Map vehicles to shipment data
//     const shipments = vehicles.map((v) => ({
//       vehicleId: v._id,
//       make: v.make,
//       model: v.model,
//       year: v.year,
//       vin: v.vin,
//       shipment: v.shipment,
//     }));

//     res.json({ success: true, count: shipments.length, shipments });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// @desc Get shipment details by vehicleId
// @route GET /api/shipments/:vehicleId
// @access Private (admin or user with access)
// const getShipmentById = async (req, res) => {
//   try {
//     const { vehicleId } = req.params;

//     const vehicle = await Vehicle.findById(vehicleId);

//     if (!vehicle || !vehicle.shipment) {
//       return res.status(404).json({ success: false, message: "Shipment not found for this vehicle" });
//     }

//     res.json({
//       success: true,
//       shipment: vehicle.shipment,
//       vehicle: {
//         vehicleId: vehicle._id,
//         make: vehicle.make,
//         model: vehicle.model,
//         year: vehicle.year,
//         vin: vehicle.vin,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// 🔹 Track Shipment by Tracking Number
const trackShipment = async (req, res) => {
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
const getAllShipments = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ "shipment.trackingNumber": { $exists: true } });

    const shipments = vehicles.map(v => ({
      vehicleId: v._id,
      vehicleDetails: {
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
      },
      shipment: v.shipment,
    }));

    res.json({ success: true, count: shipments.length, shipments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 Get Shipment By Vehicle ID
const getShipmentById = async (req, res) => {
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



export
{
  createDelivery,getAllDeliveries, getDeliveryById,updateDelivery,deleteDelivery,createShipment, trackShipment, getAllShipments, getShipmentById
}