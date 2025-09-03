// @ts-nocheck
// routes/vehicleRoutes.js
import express from "express";
import {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicleController.js";


import { vehicleImages } from "../middlewares/multer.js"; // ✅ multer config for Cloudinary/local
import { protectAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

/**
 * Public routes (anyone can view)
 */
router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);

/**
 * Admin routes (add/update/delete vehicles)
 */
router.post(
  "/",
  protectAdmin,
  vehicleImages.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addVehicle
);

router.put(
  "/:id",
  protectAdmin,
  vehicleImages.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateVehicle
);

router.delete("/:id", protectAdmin, deleteVehicle);

export default router;
