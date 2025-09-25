// @ts-nocheck
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectDB from "./db/connectDB.js";
import cloudinaryModule from "cloudinary";
import passport from "passport";
import configurePassport from "./config/passport.js";

// Routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
// ... import other routes

import { initSocket } from "./socketServer.js";
import { startAuctionScheduler } from "./services/auctionScheduler.js";

dotenv.config();
connectDB();

// Cloudinary
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "replace-with-secure-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/auctions", auctionRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/notifications", notificationRoutes);
// ... add other routes

app.get("/", (req, res) => res.send("Welcome 🚀"));

// Init Socket.io
initSocket(server);

// Start auction scheduler only once
if (process.env.NODE_ENV === "production") {
  startAuctionScheduler();
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
