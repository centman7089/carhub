import express from "express";
import {
  createAuction,
  getAuctions,
  getAuctionById,
  placeBid,
  getHighestBid,
  closeAuction,
  getPopularAuctions,
} from "../controllers/auctionController.js";

import { authorizeRoles, protectAdmin } from "../middlewares/adminAuth.js";
import protectDealer from "../middlewares/protectDealer.js";

const router = express.Router();

router.post("/:vehicleId",protectAdmin, authorizeRoles("superadmin", "admin"), createAuction);
router.get("/", getAuctions);
router.get("/popular", getPopularAuctions);
router.get("/:id", getAuctionById);
router.post("/:auctionId/bid",protectDealer, placeBid);
router.get("/:auctionId/highest-bid", getHighestBid);
router.post("/:auctionId/close",protectAdmin, authorizeRoles("superadmin", "admin") , closeAuction);

export default router;
