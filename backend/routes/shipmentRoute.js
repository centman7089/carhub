import express from "express";
import {
  createShipment,
  updateShipment,
  trackShipment,
  getAllShipments,
  getShipmentById,
  updateShipmentStatus, getActiveShipments,
  getDealerShipments,
  getDealerActiveShipments,
  getUserActiveShipments
} from "../controllers/shipmentController.js";

// import { protectAdmin } from "../middlewares/adminAuth.js";
import { authorizeRoles, protectAdmin } from "../middlewares/adminAuth.js";
import protectRoute from "../middlewares/protectRoute.js";
import protectDealer from "../middlewares/protectDealer.js";

const shipmentRouter = express.Router();


// 📌 Get all active shipments
shipmentRouter.get("/shipments", getActiveShipments);
// Create shipment for a vehicle
shipmentRouter.post("/:vehicleId",protectAdmin, authorizeRoles("superadmin", "admin"), createShipment);

// Update shipment (e.g., update delivery info or status)
shipmentRouter.put("/:vehicleId", protectAdmin, authorizeRoles("superadmin", "admin"),updateShipment);

// Track shipment by tracking number
// shipmentRouter.get("/track/:trackingNumber", trackShipment);
shipmentRouter.get(
  "/track/:trackingNumber",
  // [
  //   protectRoute,      // must be logged in as user
  //   protectDealer,    // or logged in as dealer
  //   protectAdmin,     // or logged in as admin
  //   authorizeRoles("superadmin", "admin"), // allow superadmin & admin explicitly
  // ],
  trackShipment
);

// Get all shipments
shipmentRouter.get( "/", protectAdmin, authorizeRoles("superadmin", "admin"), getAllShipments );

// Update shipment status
shipmentRouter.put("/:vehicleId/shipment/status", protectAdmin, authorizeRoles( "superadmin", "admin" ), updateShipmentStatus);

// Get shipment by vehicle ID
shipmentRouter.get( "/:vehicleId", protectAdmin, authorizeRoles( "superadmin", "admin" ), getShipmentById );
// Get shipments for a specific dealer
shipmentRouter.get( "/dealer/:dealerId", getDealerShipments );
// Dealer shipments (pass dealerId in URL)
shipmentRouter.get("/dealer/:dealerId/shipments",protectDealer, getDealerActiveShipments);
shipmentRouter.get("/user/:userId/shipments",protectRoute, getUserActiveShipments);


export default shipmentRouter;
