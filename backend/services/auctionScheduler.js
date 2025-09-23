// @ts-nocheck
// services/auctionScheduler.js
import cron from "node-cron";
import Auction from "../models/Auction.js";
import { io, userSocketMap } from "../socketServer.js";
import Notification from "../models/Notification.js";

export const startAuctionScheduler = () => {
  // Run every 30s (production: every 1m)
  cron.schedule(
    "*/30 * * * * *",
    async () => {
      try {
        const now = new Date();

        // 1) Mark auctions as LIVE
        const toLive = await Auction.updateMany(
          { startAt: { $lte: now }, endAt: { $gt: now }, status: "upcoming" },
          { $set: { status: "live" } }
        );

        if (toLive.modifiedCount > 0) {
          const started = await Auction.find({
            startAt: { $lte: now },
            endAt: { $gt: now },
            status: "live",
          }).select("_id");

          started.forEach((a) =>
            io?.to(`auction:${a._id}`).emit("auctionStarted", {
              auctionId: a._id,
            })
          );
        }

        // 2) Finalize expired auctions (batch in chunks of 50)
        const batchSize = 50;
        let hasMore = true;

        while (hasMore) {
          const endedAuctions = await Auction.find({
            endAt: { $lte: now },
            status: { $in: ["upcoming", "live"] },
          })
            .limit(batchSize)
            .lean(false); // still get mongoose docs to save

          if (!endedAuctions.length) {
            hasMore = false;
            break;
          }

          await Promise.all(
            endedAuctions.map(async (auction) => {
              auction.status = "finished";

              // determine winner
              if (auction.bids?.length) {
                const highest = auction.bids.reduce((p, c) =>
                  c.amount > p.amount ? c : p
                );
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

                  const sockets = userSocketMap.get(
                    auction.winner.toString()
                  );
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
                  console.error(
                    `❌ Failed notification for auction ${auction._id}:`,
                    e
                  );
                }
              }
            })
          );
        }
      } catch (err) {
        console.error("❌ auctionScheduler error:", err);
      }
    },
    { timezone: "UTC" }
  );
};
