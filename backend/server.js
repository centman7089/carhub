// server.mjs or server.js with "type": "module"
import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import cloudinaryModule from 'cloudinary';

import connectDB from "./db/connectDB.js";

// Routes
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRouter from './routes/adminRoute.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

dotenv.config();
connectDB();

// ✅ Cloudinary
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ✅ Middleware
app.use(cors());

// 🚨 IMPORTANT: Mount vehicles BEFORE body parsers so Multer handles file uploads


// ✅ JSON body parser only for non-file routes
// app.use((req, res, next) => {
//   if (req.originalUrl.startsWith("/api/vehicles")) {
//     // skip body-parser for vehicle uploads (handled by Multer)
//     return next();
//   }
//   express.json({ limit: "50mb" })(req, res, next);
// });

// app.use((req, res, next) => {
//   if (req.originalUrl.startsWith("/api/vehicles")) {
//     return next();
//   }
//   express.urlencoded({ limit: "50mb", extended: true })(req, res, next);
// });

// // ✅ JSON body parser only for non-file routes
// app.use((req, res, next) => {
//   if (req.originalUrl.startsWith("/api/admin")) {
//     // skip body-parser for vehicle uploads (handled by Multer)
//     return next();
//   }
//   express.json({ limit: "50mb" })(req, res, next);
// });

// app.use((req, res, next) => {
//   if (req.originalUrl.startsWith("/api/admin")) {
//     return next();
//   }
//   express.urlencoded({ limit: "50mb", extended: true })(req, res, next);
// });

app.use('/api/admin', adminRouter);
app.use('/api/vehicles', vehicleRoutes);

// Middlewares
app.use(express.json()); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use( cookieParser() );

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Share io instance globally via app
app.set('io', io);

// ✅ Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/auctions', auctionRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/notifications', notificationRoutes);



app.get('/', (req, res) => {
  res.send('Welcome 🚀');
});

// ✅ Socket.IO handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ✅ Server listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
