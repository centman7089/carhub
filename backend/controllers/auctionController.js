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
