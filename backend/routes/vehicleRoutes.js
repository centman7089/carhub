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
router.delete( '/:id', deleteVehicle );
import { createVehicleWithBusboy } from '../controllers/vehicleController';

router.post('/vehicles', (req, res) => {
  if (req.is('multipart/form-data')) {
    createVehicleWithBusboy(req, res).catch(error => {
      res.status(500).json({ error: error.message });
    });
  } else {
    createVehicle(req, res);
  }
});

export default router;
