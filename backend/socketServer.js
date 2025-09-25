// @ts-nocheck
import { Server } from "socket.io";
import Auction from "./models/Auction.js";
import Notification from "./models/Notification.js";
import { socketAuth } from "./middlewares/socketAuth.js";

export let io = null;
// Map dealerId -> Set(socketIds)
export const userSocketMap = new Map();

export const initSocket = (server) => {
  if (io) return io; // prevent double initialization

  io = new Server(server, {
    cors: { origin: "*" },
  });

  socketAuth(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("registerUser", (dealerId) => {
      if (!dealerId) return;
      const set = userSocketMap.get(dealerId) || new Set();
      set.add(socket.id);
      userSocketMap.set(dealerId, set);
      socket.data.dealerId = dealerId;
    });

    socket.on("joinAuction", (auctionId) => {
      if (!auctionId) return;
      socket.join(`auction:${auctionId}`);
    });

    socket.on("placeBid", async ({ auctionId, dealerId, amount }) => {
      try {
        const auction = await Auction.findById(auctionId);
        if (!auction) return socket.emit("bidError", { message: "Auction not found" });

        const now = new Date();
        if (!(auction.startAt <= now && auction.endAt > now))
          return socket.emit("bidError", { message: "Auction is not live" });

        if (amount <= (auction.currentBid || auction.startingPrice || 0))
          return socket.emit("bidError", { message: "Bid must be higher than current bid" });

        const prevHighestBidder = auction.highestBidder?.toString();
        const prevBidAmount = auction.currentBid;

        auction.bids.push({ bidder: dealerId, amount });
        auction.currentBid = amount;
        auction.highestBidder = dealerId;
        await auction.save();

        // broadcast
        io.to(`auction:${auctionId}`).emit("newBid", { auctionId, amount, highestBidder: dealerId });

        // notify previous highest bidder
        if (prevHighestBidder && prevHighestBidder !== dealerId) {
          try {
            const note = await Notification.create({
              user: prevHighestBidder,
              title: "You were outbid",
              body: `You were outbid on auction '${auction.title}'. New bid: ${amount}`,
              meta: { auctionId, newAmount: amount, previousAmount: prevBidAmount },
            });
            const sockets = userSocketMap.get(prevHighestBidder);
            sockets?.forEach((sid) => io.to(sid).emit("outbid", { auctionId, amount, notificationId: note._id }));
          } catch (e) {
            console.error("Notification create failed:", e);
          }
        }

        // confirm bid to bidder
        userSocketMap.get(dealerId)?.forEach((sid) =>
          io.to(sid).emit("bidSuccess", { auctionId, amount })
        );
      } catch (err) {
        console.error("Socket placeBid err:", err);
        socket.emit("bidError", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      const dealerId = socket.data.dealerId;
      if (dealerId) {
        const set = userSocketMap.get(dealerId);
        if (set) {
          set.delete(socket.id);
          if (!set.size) userSocketMap.delete(dealerId);
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};
