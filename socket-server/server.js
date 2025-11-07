const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

// Enable HTTP CORS for all routes
app.use(cors({ origin: '*' }));

// Health/root check
app.get('/', (req, res) => {
  res.send('✅ Socket.io server is running!');
});

const server = http.createServer(app);

// Socket.IO with open CORS
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // joinRoom: allow either (roomId, user) or payload object
  socket.on('joinRoom', (roomIdOrPayload, userMaybe) => {
    let roomId = roomIdOrPayload;
    let user = userMaybe;
    if (typeof roomIdOrPayload === 'object' && roomIdOrPayload !== null) {
      roomId = roomIdOrPayload.roomId;
      user = {
        userId: roomIdOrPayload.userId,
        username: roomIdOrPayload.username
      };
    }

    if (!roomId) {
      return socket.emit('error', { message: 'joinRoom requires roomId' });
    }

    socket.join(roomId);
    console.log(`📥 ${socket.id} joined room ${roomId}`);
    // Optional: notify room
    io.to(roomId).emit('roomInfo', { type: 'join', roomId, user });
  });

  // gameEvent: broadcast arbitrary event data to a room
  socket.on('gameEvent', (payload) => {
    const { roomId, event, data } = payload || {};
    if (!roomId) {
      return socket.emit('error', { message: 'gameEvent requires roomId' });
    }
    console.log(`🎮 gameEvent in ${roomId}: ${event || 'event'} ->`, data);
    io.to(roomId).emit('gameEvent', { event, data });
  });

  // updateGame: broadcast new game state to room
  socket.on('updateGame', (payload) => {
    const { roomId, state } = payload || {};
    if (!roomId) {
      return socket.emit('error', { message: 'updateGame requires roomId' });
    }
    console.log(`♻️ updateGame in ${roomId}`);
    io.to(roomId).emit('updateGame', { state });
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});

