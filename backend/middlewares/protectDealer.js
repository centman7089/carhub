// @ts-nocheck
import jwt from "jsonwebtoken";
import Dealer from "../models/dealerModel.js";

const protectDealer = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token, not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const dealerId = decoded.dealerId; // ✅ match role="dealerId"
    if (!dealerId) {
      return res.status(401).json({ msg: "Invalid token: dealer ID missing" });
    }

    const dealer = await Dealer.findById(dealerId).select("-password");
    if (!dealer) {
      return res.status(401).json({ msg: "dealer not found" });
    }

    req.dealer = dealer; // ✅ attach dealer to request
    next();
  } catch (err) {
    console.error("protectdealer error:", err);
    res.status(401).json({ msg: "Token failed" });
  }
};

export default protectDealer
