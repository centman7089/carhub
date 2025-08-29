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

const router = express.Router();

router.post('/', upload.array('images', 5), createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', upload.array('images', 5), updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
