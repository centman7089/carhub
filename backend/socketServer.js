// @ts-nocheck
// socketServer.js
import { Server } from "socket.io";
import Auction from "./models/Auction.js";
import Notification from "./models/Notification.js"; // optional if you created
// notifications
// optional: import a function to validate JWT if you want secure register
import { socketAuth } from "./middleware/socketAuth.js";

export let io = null;
// Map dealerId -> Set(socketIds)
export const userSocketMap = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  } );
 socketAuth(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Client should call registerUser after authenticating
    socket.on("registerUser", (dealerId) => {
      if (!dealerId) return;
      const set = userSocketMap.get(dealerId) || new Set();
      set.add(socket.id);
      userSocketMap.set(dealerId, set);
      socket.data.dealerId = dealerId;
    });

    // join auction room
    socket.on("joinAuction", (auctionId) => {
      if (!auctionId) return;
      socket.join(`auction:${auctionId}`);
      // optional: emit current auction state to new joiner
    });

    // place bid via socket
    socket.on("placeBid", async ({ auctionId, dealerId, amount }) => {
      try {
        const auction = await Auction.findById(auctionId);
        if (!auction) {
          socket.emit("bidError", { message: "Auction not found" });
          return;
        }

        const now = new Date();
        // Ensure cron or DB status is authoritative; but quick check here
        if (!(auction.startAt <= now && auction.endAt > now)) {
          socket.emit("bidError", { message: "Auction is not live" });
          return;
        }

        if (amount <= (auction.currentBid || auction.startingPrice || 0)) {
          socket.emit("bidError", { message: "Bid must be higher than current bid" });
          return;
        }

        const prevHighestBidder = auction.highestBidder ? auction.highestBidder.toString() : null;
        const prevBidAmount = auction.currentBid;

        // persist bid
        auction.bids.push({ bidder: dealerId, amount });
        auction.currentBid = amount;
        auction.highestBidder = dealerId;
        await auction.save();

        // broadcast update to room
        io.to(`auction:${auctionId}`).emit("newBid", {
          auctionId,
          amount,
          highestBidder: dealerId,
        });

        // notify previous highest bidder (outbid)
        if (prevHighestBidder && prevHighestBidder !== dealerId) {
          // optional: create notification in DB
          try {
            const note = await Notification.create({
              user: prevHighestBidder,
              title: "You were outbid",
              body: `You were outbid on auction '${auction.title}'. New bid: ${amount}`,
              meta: { auctionId, newAmount: amount, previousAmount: prevBidAmount },
            });

            const sockets = userSocketMap.get(prevHighestBidder);
            if (sockets) {
              sockets.forEach((sid) => io.to(sid).emit("outbid", {
                auctionId, amount, notificationId: note._id, message: note.body
              }));
            }
          } catch (e) {
            console.error("Notification create failed:", e);
          }
        }

        // confirm bid to bidder
        const bidderSockets = userSocketMap.get(dealerId);
        if (bidderSockets) bidderSockets.forEach(sid => io.to(sid).emit("bidSuccess", { auctionId, amount }));
      } catch (err) {
        console.error("Socket placeBid err:", err);
        socket.emit("bidError", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      // cleanup socket id from userSocketMap
      const dealerId = socket.data.dealerId;
      if (dealerId) {
        const set = userSocketMap.get(dealerId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) userSocketMap.delete(dealerId);
          else userSocketMap.set(dealerId, set);
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};
