import express from "express";
import {
  createAuction,
  placeBid,
  getAllAuctions,
  getAuctionById,
  closeAuction,
} from "../controllers/auctionController.js";
import protectRoute  from "../middlewares/protectRoute.js";

const router = express.Router();

// Create auction for vehicle
router.post("/:vehicleId", protectRoute, createAuction);

// Place a bid
router.post("/bid/:auctionId", protectRoute, placeBid);

// Get all auctions
router.get("/", getAllAuctions);

// Get single auction
router.get("/:auctionId", getAuctionById);

// Close auction
router.post("/close/:auctionId", protectRoute, closeAuction);

export default router;
