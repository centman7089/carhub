import express from "express";
import {
  createShipment,
  updateShipment,
  trackShipment,
  getAllShipments,
  getShipmentById,
  updateShipmentStatus
} from "../controllers/shipmentController.js";
import { protectAdmin } from "../middlewares/adminAuth.js";

const shipmentRouter = express.Router();

// Create shipment for a vehicle
shipmentRouter.post("/:vehicleId", protectAdmin, createShipment);

// Update shipment (e.g., update delivery info or status)
shipmentRouter.put("/:vehicleId", protectAdmin,updateShipment);

// Track shipment by tracking number
shipmentRouter.get("/track/:trackingNumber", trackShipment);

// Get all shipments
shipmentRouter.get( "/", protectAdmin, getAllShipments );

// Update shipment status
shipmentRouter.put("/:vehicleId/shipment/status", updateShipmentStatus);

// Get shipment by vehicle ID
shipmentRouter.get("/:vehicleId",protectAdmin, getShipmentById);

export default shipmentRouter;
