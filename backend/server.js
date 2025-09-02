// server.mjs or server.js with "type": "module"
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from "dotenv";

import connectDB from "./db/connectDB.js";
// import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRouter from './routes/authRoutes.js';
// @ts-ignore
import userRouter from './routes/userRoutes.js';
// import carRoutes from './routes/carRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRouter from './routes/adminRoute.js';
import cloudinaryModule from 'cloudinary';

dotenv.config();
connectDB();

const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
// increase limit to 10mb (adjust as needed)
app.use(express.json({ limit: '10mb' }));
app.use( express.urlencoded( { limit: '10mb', extended: true } ) );
// Parse application/json with size limit 10mb
app.use( bodyParser.json( { limit: '10mb' } ) );
// Parse application/x-www-form-urlencoded with size limit 10mb
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Share io instance globally via app
app.set('io', io);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
// app.use('/api/cars', carRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use( '/api/notifications', notificationRoutes );
app.use( '/api/admin', adminRouter );
app.get( '/', ( req, res ) =>
{
  res.send('welcom')
})

// Socket.IO
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
} );
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
// // Connect to MongoDB and start server
// const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/CarHub';
// mongoose.connect(dbUrl)
//   .then(() => {
//     server.listen(process.env.PORT || 5000, () => {
//       console.log('✅ Server running');
//     });
//   })
//   .catch(err => console.error('❌ MongoDB connection error:', err));
