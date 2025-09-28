// @ts-nocheck
// import Auction from "../models/Auction.js";
// import Vehicle from "../models/Vehicle.js";

// // Create Auction for a Vehicle
// export const createAuction = async (req, res) => {
//   try {
//     const { vehicleId } = req.params;
//     const { startingPrice, reservePrice, startTime, endTime } = req.body;

//     const vehicle = await Vehicle.findById(vehicleId);
//     if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

//     const auction = new Auction({
//       vehicle: vehicleId,
//       startingPrice,
//       currentPrice: startingPrice,
//       reservePrice,
//       startTime,
//       endTime,
//       status: "Ongoing",
//     });

//     await auction.save();

//     res.json({ success: true, message: "Auction created", auction });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Place a Bid
// export const placeBid = async (req, res) => {
//   try {
//     const { auctionId } = req.params;
//     const { amount, autoBid, maxAutoBidAmount } = req.body;
//     const dealerId = req.user._id; // requires protect middleware

//     const auction = await Auction.findById(auctionId);
//     if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

//     if (auction.status !== "Ongoing") {
//       return res.status(400).json({ success: false, message: "Auction not active" });
//     }

//     if (amount <= auction.currentPrice) {
//       return res.status(400).json({ success: false, message: "Bid must be higher than current price" });
//     }

//     const bid = {
//       bidder: dealerId,
//       amount,
//       autoBid: autoBid || false,
//       maxAutoBidAmount: autoBid ? maxAutoBidAmount : null,
//     };

//     auction.bids.push(bid);
//     auction.currentPrice = amount;

//     await auction.save();

//     res.json({ success: true, message: "Bid placed", auction });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Get All Auctions
// export const getAllAuctions = async (req, res) => {
//   try {
//     const auctions = await Auction.find()
//       .populate("vehicle", "make model year price")
//       .populate("winner", "name email")
//       .populate("bids.bidder", "name email")
//       .sort({ createdAt: -1 });

//     res.json({ success: true, count: auctions.length, auctions });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Get Single Auction
// export const getAuctionById = async (req, res) => {
//   try {
//     const { auctionId } = req.params;
//     const auction = await Auction.findById(auctionId)
//       .populate("vehicle", "make model year price")
//       .populate("bids.bidder", "name email");

//     if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

//     res.json({ success: true, auction });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Close Auction
// export const closeAuction = async (req, res) => {
//   try {
//     const { auctionId } = req.params;
//     const auction = await Auction.findById(auctionId);

//     if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

//     auction.status = "Ended";

//     // Pick highest bidder
//     if (auction.bids.length > 0) {
//       const highestBid = auction.bids.reduce((prev, curr) =>
//         curr.amount > prev.amount ? curr : prev
//       );
//       auction.winner = highestBid.bidder;
//     }

//     await auction.save();

//     res.json({ success: true, message: "Auction closed", auction });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
// controllers/auctionController.js
import Auction from "../models/Auction.js";
import Notification from "../models/Notification.js";
import { io, userSocketMap } from "../socketServer.js";

export const createAuction = async (req, res) => {
  try {
    if (!req.admin) return res.status(403).json({ success: false, message: "Admins only" });
    const { title, startAt, endAt, vehicles, startingPrice } = req.body;
    if (!title || !startAt || !endAt || !vehicles?.length) return res.status(400).json({ success: false, message: "Missing fields" });

    const auction = await Auction.create({
      title,
      startAt,
      endAt,
      vehicles,
      startingPrice: startingPrice || 0,
      currentBid: startingPrice || 0,
      createdBy: req.admin.id,
    });

    return res.status(201).json({ success: true, auction });
  } catch (err) {
    console.error("createAuction err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("vehicles", "make model year price mainImage")
      .populate("highestBidder", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, auctions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Place bid via REST (validates & emits)
export const placeBidRest = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { dealerId, amount } = req.body; // ensure you validate/authenticate user on server

    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    const now = new Date();
    if (!(auction.startAt <= now && auction.endAt > now && auction.status === "live")) {
      return res.status(400).json({ success: false, message: "Auction not live" });
    }

    if (amount <= (auction.currentBid || auction.startingPrice || 0)) {
      return res.status(400).json({ success: false, message: "Bid must be higher than current bid" });
    }

    const prevHighestBidder = auction.highestBidder ? auction.highestBidder.toString() : null;
    const prevBidAmount = auction.currentBid;

    auction.bids.push({ bidder: dealerId, amount });
    auction.currentBid = amount;
    auction.highestBidder = dealerId;
    await auction.save();

    // broadcast new bid to room
    io?.to(`auction:${auctionId}`).emit("newBid", { auctionId, amount, highestBidder: dealerId });

    // notify previous highest bidder (if any)
    if (prevHighestBidder && prevHighestBidder !== dealerId) {
      try {
        const note = await Notification.create({
          user: prevHighestBidder,
          title: "You were outbid",
          body: `You were outbid on auction '${auction.title}'. New bid: ${amount}`,
          meta: { auctionId, newAmount: amount, previousAmount: prevBidAmount },
        });
        const sockets = userSocketMap.get(prevHighestBidder);
        if (sockets) sockets.forEach(sid => io?.to(sid).emit("outbid", { auctionId, amount, notificationId: note._id }));
      } catch (e) { console.error("outbid notify fail:", e); }
    }

    return res.json({ success: true, auction });
  } catch (err) {
    console.error("placeBidRest err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const getPopularAuctions = async (req, res) => {
  try {
    // Aggregate auctions with bid counts
    const auctions = await Auction.aggregate([
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicles",
          foreignField: "_id",
          as: "vehicles",
        },
      },
      {
        $addFields: {
          bidsCount: { $size: "$bids" },
        },
      },
      {
        $sort: {
          bidsCount: -1,  // most active auctions first
          currentBid: -1, // then highest price
          createdAt: -1,  // then most recent
        },
      },
      { $limit: 10 },
      {
        $project: {
          title: 1,
          startAt: 1,
          endAt: 1,
          status: 1,
          startingPrice: 1,
          currentBid: 1,
          bidsCount: 1,
          "vehicles._id": 1,
          "vehicles.make": 1,
          "vehicles.model": 1,
          "vehicles.year": 1,
          "vehicles.price": 1,
          "vehicles.mainImage": 1,
          "vehicles.mileage": 1,     // ✅ Added for Low Mileage badge
          "vehicles.condition": 1,   // ✅ Added for Excellent Condition badge
        },
      },
    ]);

    return res.json({
      success: true,
      count: auctions.length,
      data: auctions,
    });
  } catch (error) {
    console.error("❌ getPopularAuctions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular auctions",
      error: error.message,


    });
  }
};



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

import Auction from "../models/Auction.js";
import Notification from "../models/Notification.js";
import { io, userSocketMap } from "../socketServer.js";

// ✅ Create Auction (Admin only)
export const createAuction = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: "Admins only" });
    }

    const { title, startAt, endAt, vehicles, startingPrice } = req.body;

    if (!title || !startAt || !endAt || !vehicles?.length) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const auction = await Auction.create({
      title,
      startAt,
      endAt,
      vehicles,
      startingPrice: startingPrice || 0,
      currentBid: startingPrice || 0,
      createdBy: req.admin.id,
    });

    return res.status(201).json({ success: true, auction });
  } catch (err) {
    console.error("❌ createAuction err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get All Auctions
export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("vehicles", "make model year price mainImage")
      .populate("highestBidder", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, auctions });
  } catch (err) {
    console.error("❌ getAuctions err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Place Bid via REST (with Socket.IO + Notification)
export const placeBidRest = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { dealerId, amount } = req.body; // ⚠️ secure this with JWT in real app

    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    const now = new Date();
    if (!(auction.startAt <= now && auction.endAt > now && auction.status === "live")) {
      return res.status(400).json({ success: false, message: "Auction not live" });
    }

    if (amount <= (auction.currentBid || auction.startingPrice || 0)) {
      return res.status(400).json({ success: false, message: "Bid must be higher than current bid" });
    }

    const prevHighestBidder = auction.highestBidder ? auction.highestBidder.toString() : null;
    const prevBidAmount = auction.currentBid;

    auction.bids.push({ bidder: dealerId, amount });
    auction.currentBid = amount;
    auction.highestBidder = dealerId;
    await auction.save();

    // 🔔 broadcast new bid to auction room
    io?.to(`auction:${auctionId}`).emit("newBid", { auctionId, amount, highestBidder: dealerId });

    // 🔔 notify previous highest bidder
    if (prevHighestBidder && prevHighestBidder !== dealerId) {
      try {
        const note = await Notification.create({
          user: prevHighestBidder,
          title: "You were outbid",
          body: `You were outbid on auction '${auction.title}'. New bid: ${amount}`,
          meta: { auctionId, newAmount: amount, previousAmount: prevBidAmount },
        });

        const sockets = userSocketMap.get(prevHighestBidder);
        if (sockets) {
          sockets.forEach(sid =>
            io?.to(sid).emit("outbid", { auctionId, amount, notificationId: note._id })
          );
        }
      } catch (e) {
        console.error("❌ outbid notify fail:", e);
      }
    }

    return res.json({ success: true, auction });
  } catch (err) {
    console.error("❌ placeBidRest err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get Popular Auctions
export const getPopularAuctions = async (req, res) => {
  try {
    const auctions = await Auction.aggregate([
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicles",
          foreignField: "_id",
          as: "vehicles",
        },
      },
      {
        $addFields: { bidsCount: { $size: "$bids" } },

