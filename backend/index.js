const http = require('http');
const { Server } = require('socket.io');
const Notification = require('./models/Notification');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', ({ userId }) => {
    connectedUsers[userId] = socket.id;
  });

  socket.on('disconnect', () => {
    for (const [userId, sockId] of Object.entries(connectedUsers)) {
      if (sockId === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io); // Make io available in routes/controllers

// Replace app.listen
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log('Server with socket.io running');
    });
  });
