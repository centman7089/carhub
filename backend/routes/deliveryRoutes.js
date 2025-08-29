import express from 'express';
import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery
} from '../controllers/deliveryController.js';

import protectRoute from '../middlewares/protectRoute.js';

const router = express.Router();

// Delivery routes
router.post('/', protectRoute, createDelivery);
router.get('/', protectRoute, getAllDeliveries);
router.get('/:id', protectRoute, getDeliveryById);
router.put('/:id', protectRoute, updateDelivery);
router.delete('/:id', protectRoute, deleteDelivery);

export default router;
