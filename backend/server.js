// server.js
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

// Socket & Scheduler
import { initSocket } from "./socketServer.js";
import { startAuctionScheduler } from "./services/auctionScheduler.js";

// Routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import dealerRouter from "./routes/dealerRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bodyTypeRoutes from "./routes/bodyTypeRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRouter from "./routes/adminRoute.js";
import shipmentRouter from "./routes/shipmentRoute.js";
import socialRoutes from "./routes/socialRoutes.js";

dotenv.config();

// ✅ Connect MongoDB
connectDB(process.env.MONGO_URI);

// ✅ Cloudinary config
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "replace-with-secure-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// ✅ Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/dealer", dealerRouter);
app.use("/api/auctions", auctionRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bodytypes", bodyTypeRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRouter);
app.use("/api/shipment", shipmentRouter);
app.use("/auth", socialRoutes);

app.get("/", (req, res) => res.send("Welcome to CarHub 🚀"));

// ✅ Initialize Socket.IO
initSocket(server);

// ✅ Start Auction Scheduler (only once in production)
if (process.env.NODE_ENV === "production") {
  startAuctionScheduler();
}

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

