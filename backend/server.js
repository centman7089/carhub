// server.js (or app.js)
import process from "process";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import cloudinaryModule from "cloudinary";
import passport from "passport";
import configurePassport from "./config/passport.js";

// routes
import adminRouter from "./routes/adminRoute.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import dealerRouter from "./routes/dealerRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import shipmentRouter from "./routes/shipmentRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bodyTypeRoutes from "./routes/bodyTypeRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";

// socket & scheduler
import { initSocket } from "./socketServer.js";
import { startAuctionScheduler } from "./services/auctionScheduler.js";

import session from "express-session";

dotenv.config();
connectDB();

const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

// middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "replace-with-secure-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

// passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/api/admin", adminRouter);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/dealer", dealerRouter);
app.use("/api/auctions", auctionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shipment", shipmentRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/bodytypes", bodyTypeRoutes);
app.use("/api/listings", listingRoutes);

app.get("/", (req, res) => res.send("Welcome 🚀"));

// init socket and scheduler
initSocket(server);
startAuctionScheduler();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
