// @ts-nocheck
// server.mjs or server.js with "type": "module"
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cloudinaryModule from "cloudinary";
import cookieParser from "cookie-parser";

import connectDB from "./db/connectDB.js";

// Routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRouter from "./routes/adminRoute.js";

dotenv.config();
connectDB();

// ✅ Cloudinary
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ Middleware
app.use(cors());
app.use(cookieParser());

// ✅ Only parse JSON if `Content-Type` is application/json
app.use(express.json({
  limit: "50mb",
  type: ["application/json"], // <-- this prevents parsing multipart/form-data
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// ✅ Parse URL-encoded bodies (NOT multipart)
app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));

// Optional: add a header for debugging large payloads
app.use((req, res, next) => {
  res.setHeader("X-Request-Size-Limit", "50mb");
  next();
});

// ✅ Routes
app.use("/api/admin", adminRouter);
app.use("/api/vehicles", vehicleRoutes); // ⬅️ Multer will handle multipart here

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/auctions", auctionRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Welcome 🚀");
});

// ✅ Socket.IO handlers
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ✅ Server listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server started at http://localhost:${PORT}`)
);
