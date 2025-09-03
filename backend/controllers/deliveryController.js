// @ts-nocheck

import Delivery from '../models/Delivery.js';
// controllers/deliveryController.js
import Vehicle from "../models/vehicle.js";
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



const createShipment = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const {
      carrierCompany,
      expectedDelivery,
      pickupAddress,
      deliveryAddress,
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
      trackingNumber, // auto-generated
      carrierCompany,
      expectedDelivery,
      pickupAddress,
      deliveryAddress,
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
      vehicle,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update shipment status (e.g. mark delivered)
 const updateShipmentStatus = async (req, res) => {
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

// ✅ Search shipment by tracking number
const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const vehicle = await Vehicle.findOne({
      "shipment.trackingNumber": trackingNumber,
    });

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    }

    res.json({
      success: true,
      trackingNumber,
      shipment: vehicle.shipment,
      vehicle: {
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
  createDelivery,getAllDeliveries, getDeliveryById,updateDelivery,deleteDelivery,createShipment,updateShipmentStatus, trackShipment
}