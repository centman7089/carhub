// import express from "express";
// import {
//   createAuction,
//   placeBid,
//   getAllAuctions,
//   getAuctionById,
//   closeAuction,
// } from "../controllers/auctionController.js";
// import protectRoute  from "../middlewares/protectRoute.js";

// const router = express.Router();

// // Create auction for vehicle
// router.post("/:vehicleId", protectRoute, createAuction);

// // Place a bid
// router.post("/bid/:auctionId", protectRoute, placeBid);

// // Get all auctions
// router.get("/", getAllAuctions);

// // Get single auction
// router.get("/:auctionId", getAuctionById);

// // Close auction
// router.post("/close/:auctionId", protectRoute, closeAuction);

// export default router;


import express from "express";
import { createAuction, getAuctions, placeBidRest, getPopularAuctions } from "../controllers/auctionController.js";
const router = express.Router();

router.post("/", createAuction);
router.get( "/", getAuctions );
router.get("/popular", getPopularAuctions);
router.post("/:auctionId/bid", placeBidRest);

export default router;
