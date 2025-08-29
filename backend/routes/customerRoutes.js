// routes/customerRoutes.js
import express from 'express';
import {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerAuctions,
  getCustomerCars
} from '../controllers/customerController.js';
import protectRoute from '../middlewares/protectRoute.js';



const router = express.Router();

// Customer routes
router.get('/profile', protectRoute, getCustomerProfile);
router.put('/profile', protectRoute, updateCustomerProfile);
router.get('/my-auctions', protectRoute, getCustomerAuctions);
router.get('/my-cars', protectRoute, getCustomerCars);

export default router;
