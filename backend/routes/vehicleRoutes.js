// @ts-nocheck
import express from 'express';
import upload from '../middlewares/multer.js';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { vehicleImages } from '../middlewares/upload.js';
import { protectAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/create-vehicle', protectAdmin,vehicleImages,createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', upload.array('images', 5), updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
