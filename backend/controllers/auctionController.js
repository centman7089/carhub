import Auction from "../models/Auction.js";
import Vehicle from "../models/Vehicle.js";

// Create Auction for a Vehicle
export const createAuction = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { startingPrice, reservePrice, startTime, endTime } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

    const auction = new Auction({
      vehicle: vehicleId,
      startingPrice,
      currentPrice: startingPrice,
      reservePrice,
      startTime,
      endTime,
      status: "Ongoing",
    });

    await auction.save();

    res.json({ success: true, message: "Auction created", auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Place a Bid
export const placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount, autoBid, maxAutoBidAmount } = req.body;
    const userId = req.user._id; // requires protect middleware

    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    if (auction.status !== "Ongoing") {
      return res.status(400).json({ success: false, message: "Auction not active" });
    }

    if (amount <= auction.currentPrice) {
      return res.status(400).json({ success: false, message: "Bid must be higher than current price" });
    }

    const bid = {
      bidder: userId,
      amount,
      autoBid: autoBid || false,
      maxAutoBidAmount: autoBid ? maxAutoBidAmount : null,
    };

    auction.bids.push(bid);
    auction.currentPrice = amount;

    await auction.save();

    res.json({ success: true, message: "Bid placed", auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Auctions
export const getAllAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("vehicle", "make model year price")
      .populate("winner", "name email")
      .populate("bids.bidder", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: auctions.length, auctions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Auction
export const getAuctionById = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await Auction.findById(auctionId)
      .populate("vehicle", "make model year price")
      .populate("bids.bidder", "name email");

    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    res.json({ success: true, auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Close Auction
export const closeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await Auction.findById(auctionId);

    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    auction.status = "Ended";

    // Pick highest bidder
    if (auction.bids.length > 0) {
      const highestBid = auction.bids.reduce((prev, curr) =>
        curr.amount > prev.amount ? curr : prev
      );
      auction.winner = highestBid.bidder;
    }

    await auction.save();

    res.json({ success: true, message: "Auction closed", auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
