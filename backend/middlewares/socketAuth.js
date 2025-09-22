// @ts-nocheck
import jwt from "jsonwebtoken";
import Dealer from "../models/dealerModel.js";

export const socketAuth = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // ✅ Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const dealer = await Dealer.findById(decoded.id);

      if (!dealer) {
        return next(new Error("Authentication error: Dealer not found"));
      }

      // Attach dealer to socket
      socket.dealer = dealer;

      // Join dealer’s personal room
      socket.join(dealer._id.toString());

      console.log(`✅ ${dealer.email} connected via socket`);
      next();
    } catch (err) {
      console.error("❌ Socket auth failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🔗 Socket connected:", socket.dealer._id);

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.dealer.email} disconnected`);
    });
  });
};
