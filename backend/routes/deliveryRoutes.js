import express from 'express';
import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery, createShipment,
  updateShipmentStatus,trackShipment
} from '../controllers/deliveryController.js';

import protectRoute from '../middlewares/protectRoute.js';

const router = express.Router();

// Delivery routes
router.post('/', protectRoute, createDelivery);
router.get('/', protectRoute, getAllDeliveries);
router.get('/:id', protectRoute, getDeliveryById);
router.put('/:id', protectRoute, updateDelivery);
router.delete( '/:id', protectRoute, deleteDelivery );




// Admin creates shipment for a vehicle
router.post("/:vehicleId/shipment", createShipment);

// Update shipment status
router.put("/:vehicleId/shipment/status", updateShipmentStatus);
// ✅ Track shipment
router.get("/track/:trackingNumber", trackShipment);

export default router;


