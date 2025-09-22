import process from "process";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import cloudinaryModule from "cloudinary";

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
app.use("/api/shipment", shipmentRouter);

app.get("/", (req, res) => res.send("Welcome 🚀"));

// init socket.io and auction scheduler
initSocket(server);           // sets up socket handlers
startAuctionScheduler();      // runs cron that updates auction status and finalizes auctions

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));





// // @ts-nocheck
// // server.mjs or server.js with "type": "module"
// import process from "process";

// process.on("newListener", (event, listener) => {
//   if (event === "exit") {
//     console.log("New exit listener added:", listener.toString());
//     console.log("Total exit listeners:", process.listenerCount("exit"));
//   }
// });

// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import http from "http";
// import { Server } from "socket.io";
// import cloudinaryModule from "cloudinary";
// import cookieParser from "cookie-parser";

// import connectDB from "./db/connectDB.js";

// // Routes
// import authRouter from "./routes/authRoutes.js";
// import userRouter from "./routes/userRoutes.js";
// import auctionRoutes from "./routes/auctionRoutes.js";
// import deliveryRoutes from "./routes/deliveryRoutes.js";
// import customerRoutes from "./routes/customerRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";
// import categoryRoutes from "./routes/categoryRoutes.js";
// import bodyTypeRoutes from "./routes/bodyTypeRoutes.js";
// import listingRoutes from "./routes/listingRoutes.js";
// import vehicleRoutes from "./routes/vehicleRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";
// import adminRouter from "./routes/adminRoute.js";
// import shipmentRouter from "./routes/shipmentRoute.js";
// import dealerRouter from "./routes/dealerRoutes.js";

// // import process from "process";

// // setInterval(() => {
// //   console.log("Exit listeners:", process.listenerCount("exit"));
// // }, 10000 );
// // import { EventEmitter } from "events";
// // EventEmitter.defaultMaxListeners = 0; // disables the warning

// // console.log(process.listenerCount("exit"));
// // console.log(process.listeners("exit"));


// dotenv.config();
// connectDB();

// // ✅ Cloudinary
// const cloudinary = cloudinaryModule.v2;
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const app = express();
// const server = http.createServer(app);

// // ✅ Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // ✅ Middleware
// app.use(cors());
// app.use( cookieParser() );

// // Only parse JSON if content-type is application/json
// app.use(
//   express.json({
//     limit: "50mb",
//     type: "application/json", // 👈 prevents parsing form-data
//   })
// );

// app.use(
//   express.urlencoded({
//     limit: "50mb",
//     extended: true,
//     type: "application/x-www-form-urlencoded", // 👈 prevents conflict
//   })
// );

// // ✅ Only parse JSON if `Content-Type` is application/json




// // ✅ Routes
// app.use("/api/admin", adminRouter);
// app.use("/api/vehicles", vehicleRoutes); // ⬅️ Multer will handle multipart here

// app.use("/api/auth", authRouter);
// app.use("/api/user", userRouter);
// app.use("/api/dealer", dealerRouter);
// app.use("/api/auctions", auctionRoutes);
// app.use("/api/deliveries", deliveryRoutes);
// app.use("/api/customers", customerRoutes);
// app.use("/api/reports", reportRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/bodytypes", bodyTypeRoutes);
// app.use("/api/listings", listingRoutes);
// app.use( "/api/notifications", notificationRoutes );
// app.use( "/api/shipment", shipmentRouter );

// app.get("/", (req, res) => {
//   res.send("Welcome 🚀");
// });

// // ✅ Socket.IO handlers
// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });

// // ✅ Server listen
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () =>
//   console.log(`Server started at http://localhost:${PORT}`)
// );

// server.js
// @ts-nocheck
