
import Auction from '../models/Auction.js';
// import Vehicle from '../models/Vehicle.js';

// Create auction
const createAuction = async (req, res) => {
  try {
    const { car, currentBid, endsAt } = req.body;
    const auction = await Auction.create({ car, currentBid, endsAt });
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all auctions (with vehicle details)
const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('car') // Pulls in full vehicle details
      .sort({ endsAt: 1 }); // soonest ending first
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single auction
const getAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('car');
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update auction (e.g., currentBid, numberOfBids, endsAt)
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('car');
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete auction
const deleteAuction = async (req, res) => {
  try {
    const deleted = await Auction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Auction not found' });
    res.json({ message: 'Auction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export {createAuction, getAuction, getAuctions, updateAuction, deleteAuction}