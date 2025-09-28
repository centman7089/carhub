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
import socialRoutes from "./routes/socialRoutes.js";


// routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bodyTypeRoutes from "./routes/bodyTypeRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRouter from "./routes/adminRoute.js";
import shipmentRouter from "./routes/shipmentRoute.js";
import dealerRouter from "./routes/dealerRoutes.js";

// socket & scheduler
import { initSocket } from "./socketServer.js";
import { startAuctionScheduler } from "./services/auctionScheduler.js";
import session from "express-session";

dotenv.config();
connectDB();

// cloudinary
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
app.use(express.json({ limit: "50mb", type: "application/json" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, type: "application/x-www-form-urlencoded" }));

// routes
app.use("/api/admin", adminRouter);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/dealer", dealerRouter);
app.use("/api/auctions", auctionRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bodytypes", bodyTypeRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use( "/api/shipment", shipmentRouter );

app.use(session({
  secret: process.env.SESSION_SECRET || "replace-with-secure-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

// init passport
configurePassport();
app.use(passport.initialize());
app.use( passport.session() );
// routes
app.use("/auth", socialRoutes);


app.get("/", (req, res) => res.send("Welcome 🚀"));

// init socket.io and auction scheduler
// initSocket(server);           // sets up socket handlers
// startAuctionScheduler();      // runs cron that updates auction status and finalizes auctions

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

