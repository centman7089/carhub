// @ts-nocheck
// import Car from '../models/Car.js';
import Vehicle from '../models/Vehicle.js';
import Auction from '../models/Auction.js';

const getPopularListings = async (req, res) => {
  try {
    const auctions = await Auction.find({ status: 'active' })
      .sort({ numberOfBids: -1 }) // Most bid-on
      .limit(5)
      .populate('vehicle');

    const listings = auctions.map(auction => ({
      ...auction.car.toObject(),
      auctionId: auction._id,
      currentBid: auction.currentBid,
      numberOfBids: auction.numberOfBids,
      endsAt: auction.endsAt,
      tags: auction.car.tags
    }));

    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings', error: err });
  }
};

export {getPopularListings}