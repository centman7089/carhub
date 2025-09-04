import express from 'express';
import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery, createShipment,
  updateShipmentStatus,trackShipment, getAllShipments, getShipmentById
} from '../controllers/deliveryController.js';

import protectRoute from '../middlewares/protectRoute.js';
import { protectAdmin } from "../middlewares/adminAuth.js";


const router = express.Router();

// Delivery routes
router.post('/', protectRoute, createDelivery);
router.get('/', protectRoute, getAllDeliveries);
router.get('/:id', protectRoute, getDeliveryById);
router.put('/:id', protectRoute, updateDelivery);
router.delete( '/:id', protectRoute, deleteDelivery );




// Admin creates shipment for a vehicle
router.post("/:vehicleId/shipment", protectAdmin, createShipment);

// Update shipment status
router.put("/:vehicleId/shipment/status", protectAdmin, updateShipmentStatus);
// ✅ Track shipment
router.get( "/track/:trackingNumber", trackShipment );

/**
 * @desc Get all shipments
 * @route GET /api/shipments
 * @access Private (admin)
 */
router.get("/", protectAdmin, getAllShipments);

/**
 * @desc Get shipment details by vehicle ID
 * @route GET /api/shipments/:vehicleId
 * @access Private (admin)
 */
router.get("/:vehicleId", protectAdmin, getShipmentById);

export default router;


