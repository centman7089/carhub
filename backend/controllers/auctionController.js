// @ts-nocheck
import Auction from "../models/Auction.js";
import Vehicle from "../models/Vehicle.js";
import Notification from "../models/Notification.js";
import { io, userSocketMap } from "../socketServer.js";
import Dealer from "../models/dealerModel.js";     // ✅ import Dealer model
/**
 * ✅ Create Auction (Admin only)
 * Route: POST /api/auctions/:vehicleId
 */
export const createAuction = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: "Admins only" });
    }

    const { vehicleId } = req.params;
    const { title, startAt, endAt, startingPrice } = req.body;

    if (!title || !startAt || !endAt || !vehicleId) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

      // Convert to Date (Mongo will store as UTC automatically)
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (endDate <= startDate) {
      return res.status(400).json({ success: false, message: "End time must be after start time" });
    }


    const auction = await Auction.create({
      title,
      startAt: startDate,
      endAt: endDate,
      vehicle: vehicleId, // ✅ single vehicle
      startingPrice: startingPrice || 0,
      currentBid: startingPrice || 0,
      createdBy: req.admin.id,
      status: "live",
    });

    return res.status(201).json({ success: true, auction });
  } catch (err) {
    console.error("createAuction err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Get all auctions
 * Route: GET /api/auctions
 */
export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("vehicle", "make model year price mainImage")
      .populate("highestBidder", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, auctions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Get auction by ID
 * Route: GET /api/auctions/:id
 */
export const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("vehicle", "make model year price mainImage")
      .populate("highestBidder", "firstName lastName email");

    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    return res.json({ success: true, auction });
  } catch (err) {
    console.error("getAuctionById err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Place bid (REST) + Socket.IO + Notifications
 * Route: POST /api/auctions/:auctionId/bid
 */
// export const placeBid = async (req, res) => {
//   try {
//     const { auctionId } = req.params;
//     const { amount } = req.body;
//     const dealerId = req.dealer?.id; // assumes JWT

//     const auction = await Auction.findById(auctionId);
//     if (!auction) {
//       return res.status(404).json({ success: false, message: "Auction not found" });
//     }

//     const now = new Date();
//     if (!(auction.startAt <= now && auction.endAt > now && auction.status === "live")) {
//       return res.status(400).json({ success: false, message: "Auction not live" });
//     }

//     if (amount <= (auction.currentBid || auction.startingPrice || 0)) {
//       return res.status(400).json({ success: false, message: "Bid must be higher than current bid" });
//     }

//     const prevHighestBidder = auction.highestBidder ? auction.highestBidder.toString() : null;
//     const prevBidAmount = auction.currentBid;

//     auction.bids.push({ bidder: dealerId, amount });
//     auction.currentBid = amount;
//     auction.highestBidder = dealerId;
//     await auction.save();

//     // 🔊 Broadcast to all connected clients in this auction room
//     io?.to(`auction:${auctionId}`).emit("newBid", {
//       auctionId,
//       amount,
//       highestBidder: dealerId,
//     });

//     // 📩 Notify previous highest bidder
//     if (prevHighestBidder && prevHighestBidder !== dealerId) {
//       try {
//         const note = await Notification.create({
//           dealer: prevHighestBidder,
//           title: "You were outbid",
//           body: `You were outbid on auction '${auction.title}'. New bid: ${amount}`,
//           meta: { auctionId, newAmount: amount, previousAmount: prevBidAmount },
//         });

//         const sockets = userSocketMap.get(prevHighestBidder);
//         if (sockets) {
//           sockets.forEach((sid) =>
//             io?.to(sid).emit("outbid", {
//               auctionId,
//               amount,
//               notificationId: note._id,
//             })
//           );
//         }
//       } catch (e) {
//         console.error("outbid notify fail:", e);
//       }
//     }

//     return res.json({ success: true, auction });
//   } catch (err) {
//     console.error("placeBid err:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
export const placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const dealerId = req.dealer?.id; // assumes dealer JWT

    // ✅ Find auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    // ✅ Ensure dealer made a deposit and it’s verified
    // Assuming you store deposit info in `Dealer` or a `Deposit` model
    const dealer = await Dealer.findById(dealerId);
    if (!dealer || dealer.depositStatus !== "Verified") {
      return res
        .status(403)
        .json({ success: false, message: "You must make and verify a deposit before bidding" });
    }

    const now = new Date();

    // ✅ Pure time check (ignore manual status)
    if (now < auction.startAt) {
      return res.status(400).json({ success: false, message: "Auction has not started yet" });
    }
    if (now > auction.endAt) {
      return res.status(400).json({ success: false, message: "Auction has already ended" });
    }

    // ✅ Validate bid
    if (amount <= (auction.currentBid || auction.startingPrice || 0)) {
      return res
        .status(400)
        .json({ success: false, message: "Bid must be higher than current bid" });
    }

    // ✅ Store previous top bidder (for notifications)
    const prevHighestBidder = auction.highestBidder ? auction.highestBidder.toString() : null;
    const prevBidAmount = auction.currentBid;

    // ✅ Update auction
    auction.bids.push({
      bidder: dealerId,
      amount,
      depositStatus: dealer.depositStatus, // keep history
    });
    auction.currentBid = amount;
    auction.highestBidder = dealerId;

    // Optional: auto-update status
    if (auction.status !== "live") {
      auction.status = "live";
    }

    await auction.save();

    // 🔊 Broadcast to all connected clients
    io?.to(`auction:${auctionId}`).emit("newBid", {
      auctionId,
      amount,
      highestBidder: dealerId,
    });

    // 📩 Notify previous highest bidder
    if (prevHighestBidder && prevHighestBidder !== dealerId) {
      try {
        const note = await Notification.create({
          dealer: prevHighestBidder,
          title: "You were outbid",
          body: `You were outbid on auction '${auction.title}'. New bid: ${amount}`,
          meta: { auctionId, newAmount: amount, previousAmount: prevBidAmount },
        });

        const sockets = userSocketMap.get(prevHighestBidder);
        if (sockets) {
          sockets.forEach((sid) =>
            io?.to(sid).emit("outbid", {
              auctionId,
              amount,
              notificationId: note._id,
            })
          );
        }
      } catch (e) {
        console.error("outbid notify fail:", e);
      }
    }

    return res.json({ success: true, auction });
  } catch (err) {
    console.error("placeBid err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



/**
 * ✅ Get highest bid
 * Route: GET /api/auctions/:auctionId/highest-bid
 */
export const getHighestBid = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }
    return res.json({
      success: true,
      highestBid: auction.currentBid,
      highestBidder: auction.highestBidder,
    });
  } catch (err) {
    console.error("getHighestBid err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Close Auction (Admin only)
 * Route: POST /api/auctions/:auctionId/close
 */
export const closeAuction = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: "Admins only" });
    }

    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    auction.status = "finished";
    await auction.save();

    io?.to(`auction:${auction._id}`).emit("auctionClosed", {
      auctionId: auction._id,
      highestBid: auction.currentBid,
      highestBidder: auction.highestBidder,
    });

    return res.json({ success: true, message: "Auction closed", auction });
  } catch (err) {
    console.error("closeAuction err:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Popular Auctions (Top 10 by activity)
 * Route: GET /api/auctions/popular
 */
export const getPopularAuctions = async (req, res) => {
  try {
    const auctions = await Auction.aggregate([
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      { $unwind: "$vehicle" },
      { $addFields: { bidsCount: { $size: "$bids" } } },
      {
        $sort: {
          bidsCount: -1,
          currentBid: -1,
          createdAt: -1,
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
          "vehicle._id": 1,
          "vehicle.make": 1,
          "vehicle.model": 1,
          "vehicle.year": 1,
          "vehicle.price": 1,
          "vehicle.mainImage": 1,
          "vehicle.mileage": 1,
          "vehicle.condition": 1,
        },
      },
    ]);

    return res.json({ success: true, count: auctions.length, data: auctions });
  } catch (error) {
    console.error("❌ getPopularAuctions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular auctions",
      error: error.message,
    });
  }
};




