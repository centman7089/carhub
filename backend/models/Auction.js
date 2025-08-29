
import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  currentBid: { type: Number, required: true },
  numberOfBids: { type: Number, default: 0 },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' }
}, { timestamps: true });

const Auction = mongoose.model( 'Auction', auctionSchema );

export default Auction
