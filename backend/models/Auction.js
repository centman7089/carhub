// models/auctionModel.js
import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    autoBid: { type: Boolean, default: false }, // true if it's an auto bid
    maxAutoBidAmount: { type: Number }, // cap for auto-bid
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auctionSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    startingPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    reservePrice: { type: Number }, // optional
    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Ended"],
      default: "Pending",
    },
    bids: [bidSchema],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Auction = mongoose.model("Auction", auctionSchema);
export default Auction;
