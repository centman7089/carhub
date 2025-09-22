// @ts-nocheck
// services/auctionScheduler.js
import cron from "node-cron";
import Auction from "../models/Auction.js";
import { io, userSocketMap } from "../socketServer.js";
import Notification from "../models/Notification.js";

// Run every 30 seconds (adjust to 1m in production)
export const startAuctionScheduler = () => {
  // schedule: every 30s -> '*/30 * * * * *' ; every minute -> '*/1 * * * *'
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const now = new Date();

      // 1) Mark auctions that should be live
      const toLive = await Auction.updateMany(
        { startAt: { $lte: now }, endAt: { $gt: now }, status: "upcoming" },
        { status: "live" }
      );
      if (toLive.nModified) {
        // notify rooms that auction started
        const started = await Auction.find({ startAt: { $lte: now }, endAt: { $gt: now }, status: "live" });
        started.forEach(a => io?.to(`auction:${a._id}`).emit("auctionStarted", { auctionId: a._id }));
      }

      // 2) Finalize auctions that ended
      const endedAuctions = await Auction.find({ endAt: { $lte: now }, status: { $in: ["upcoming", "live"] } });
      for (const auction of endedAuctions) {
        auction.status = "finished";

        // Determine winner if any
        if (auction.bids && auction.bids.length) {
          const highest = auction.bids.reduce((p, c) => (c.amount > p.amount ? c : p), auction.bids[0]);
          auction.winner = highest.bidder;
          auction.highestBidder = highest.bidder;
          auction.currentBid = highest.amount;
        }

        await auction.save();

        // Notify auction room that it finished
        io?.to(`auction:${auction._id}`).emit("auctionEnded", {
          auctionId: auction._id,
          winner: auction.winner,
          finalAmount: auction.currentBid,
        });

        // Notify winner privately
        if (auction.winner) {
          try {
            const note = await Notification.create({
              user: auction.winner,
              title: "You won the auction!",
              body: `You won auction '${auction.title}' with ${auction.currentBid}`,
              meta: { auctionId: auction._id, amount: auction.currentBid }
            });

            const sockets = userSocketMap.get(auction.winner.toString());
            if (sockets) sockets.forEach(sid => io?.to(sid).emit("auctionWon", { auctionId: auction._id, amount: auction.currentBid, notificationId: note._id }));
          } catch (e) {
            console.error("Failed creating winner notification:", e);
          }
        }
      }
    } catch (err) {
      console.error("auctionScheduler error:", err);
    }
  }, { timezone: "UTC" });
};
