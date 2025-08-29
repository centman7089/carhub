// server.mjs or server.js with "type": "module"
import express from 'express';
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

dotenv.config();
connectDB();

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
app.use(express.json());

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
