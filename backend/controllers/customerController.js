// @ts-nocheck
import User from '../models/userModel.js';
// import Car from '../models/Car.js';
import Auction from '../models/Auction.js';
import Vehicle from '../models/Vehicle.js';

// Get customer profile
export const getCustomerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Update customer profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get customer auctions
export const getCustomerAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ user: req.user.id }).populate('car');
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your auctions' });
  }
};

// Get cars listed by customer
export const getCustomerCars = async (req, res) => {
  try {
    const cars = await Vehicle.find({ user: req.user.id });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your cars' });
  }
};
