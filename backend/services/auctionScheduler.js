// @ts-nocheck
// services/auctionScheduler.js
import cron from "node-cron";
import Auction from "../models/Auction.js";
import { io, userSocketMap } from "../socketServer.js";
import Notification from "../models/Notification.js";

/**
 * Cron schedule:
//  * - For development: run every 30 seconds -> "*/30 * * * * *"
//  * - For production (every minute): "*/1 * * * *" (without seconds when not using seconds)
//  */
export const startAuctionScheduler = () => {
  cron.schedule(
    "*/30 * * * * *", // every 30s (dev). Use "*/1 * * * *" in production for once/minute cron (5 fields).
    async () => {
      try {
        const now = new Date();

        // 1) Set auctions to live that should be live now
        const toLiveRes = await Auction.updateMany(
          { startAt: { $lte: now }, endAt: { $gt: now }, status: "upcoming" },
          { $set: { status: "live" } }
        );

        if (toLiveRes.modifiedCount > 0) {
          const started = await Auction.find({
            startAt: { $lte: now },
            endAt: { $gt: now },
            status: "live",
          }).select("_id");

          started.forEach((a) =>
            io?.to(`auction:${a._id}`).emit("auctionStarted", { auctionId: a._id })
          );
        }

        // 2) Finalize ended auctions in batches
        const batchSize = 50;
        while (true) {
          const endedAuctions = await Auction.find({
            endAt: { $lte: now },
            status: { $in: ["upcoming", "live"] },
          })
            .limit(batchSize)
            .exec();

          if (!endedAuctions.length) break;

          await Promise.all(
            endedAuctions.map(async (auction) => {
              auction.status = "finished";

              // determine winner
              if (auction.bids?.length) {
                const highest = auction.bids.reduce((p, c) => (c.amount > p.amount ? c : p));
                auction.winner = highest.bidder;
                auction.highestBidder = highest.bidder;
                auction.currentBid = highest.amount;
              }

              await auction.save();

              // notify room
              io?.to(`auction:${auction._id}`).emit("auctionEnded", {
                auctionId: auction._id,
                winner: auction.winner,
                finalAmount: auction.currentBid,
              });

              // notify winner
              if (auction.winner) {
                try {
                  const note = await Notification.create({
                    user: auction.winner,
                    title: "You won the auction!",
                    body: `You won auction '${auction.title}' with ${auction.currentBid}`,
                    meta: { auctionId: auction._id, amount: auction.currentBid },
                  });

                  const sockets = userSocketMap.get(auction.winner.toString());
                  if (sockets) {
                    sockets.forEach((sid) =>
                      io?.to(sid).emit("auctionWon", {
                        auctionId: auction._id,
                        amount: auction.currentBid,
                        notificationId: note._id,
                      })
                    );
                  }
                } catch (e) {
                  console.error(`Failed notification for auction ${auction._id}:`, e);
                }
              }
            })
          );
        }
      } catch (err) {
        console.error("auctionScheduler error:", err);
      }
    },
    { timezone: "UTC" }
  );
};
