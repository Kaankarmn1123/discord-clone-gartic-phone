const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🚀 Game Server Starting...');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');
console.log('Frontend URL:', FRONTEND_URL);

// Test modu için development ortamında credentials kontrolünü esnet
if (process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseKey)) {
  console.error('❌ Supabase credentials are missing in production!');
  process.exit(1);
} else if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Running in development mode with limited functionality');
}

// Initialize Supabase (with fallback for development)
let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️  Supabase not initialized - using mock functions for development');
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      match: () => ({ data: [], error: null })
    })
  };
}

const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Gartic Phone oyunu için oda katılımı
  socket.on('join-gartic-room', async (roomId, userId, username) => {
    socket.join(roomId);
    console.log(`👤 User ${username} (${userId}) joined Gartic Phone room: ${roomId}`);
    
    // Diğer kullanıcılara bildir
    socket.to(roomId).emit('user-joined-gartic', { userId, username });

    try {
      // Oyuncu bilgilerini Supabase'e kaydet
      const { data, error } = await supabase
        .from('game_session_players')
        .insert([{ 
          session_id: roomId, 
          user_id: userId, 
          is_ready: false,
          username: username 
        }]);
      
      if (error) {
        console.error('❌ Supabase error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
        return;
      }
      
      socket.emit('gartic-room-joined', { roomId, userId });
    } catch (error) {
      console.error('❌ Error joining Gartic room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }

    // Oyuncu ayrıldığında
    socket.on('disconnect', async () => {
      console.log('👋 User disconnected:', socket.id);
      socket.to(roomId).emit('user-left-gartic', { userId, username });
      
      try {
        const { data, error } = await supabase
          .from('game_session_players')
          .delete()
          .match({ session_id: roomId, user_id: userId });
        
        if (error) {
          console.error('❌ Supabase error leaving room:', error);
        }
      } catch (error) {
        console.error('❌ Error leaving Gartic room:', error);
      }
    });
  });

  // Gartic Phone oyun başlatma
  socket.on('start-gartic-game', async (roomId, gameSettings) => {
    try {
      console.log('🎮 Starting Gartic Phone game in room:', roomId);
      
      // Oyun durumunu güncelle
      const { data, error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'in_progress',
          game_type: 'gartic_phone',
          settings: gameSettings 
        })
        .match({ id: roomId });
        
      if (error) {
        console.error('❌ Supabase error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
        return;
      }
      
      // Tüm oyunculara oyunun başladığını bildir
      io.to(roomId).emit('gartic-game-started', { roomId, gameSettings });
      console.log('✅ Gartic Phone game started successfully in room:', roomId);
    } catch (error) {
      console.error('❌ Error starting Gartic Phone game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Gartic Phone tur geçişleri
  socket.on('gartic-next-round', async (roomId, roundData) => {
    try {
      console.log('🔄 Next Gartic Phone round:', roomId);
      io.to(roomId).emit('gartic-round-update', roundData);
    } catch (error) {
      console.error('❌ Error in Gartic Phone round:', error);
    }
  });

  // Gartic Phone çizim gönderme
  socket.on('gartic-submit-drawing', (roomId, drawingData) => {
    console.log('🎨 Drawing submitted to room:', roomId);
    socket.to(roomId).emit('gartic-new-drawing', drawingData);
  });

  // Gartic Phone tahmin gönderme
  socket.on('gartic-submit-guess', (roomId, guessData) => {
    console.log('💭 Guess submitted to room:', roomId);
    socket.to(roomId).emit('gartic-new-guess', guessData);
  });

  // Genel oyun odası katılımı (eski fonksiyon - backward compatibility)
  socket.on('join-room', async (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    try {
      const { data, error } = await supabase
        .from('game_session_players')
        .insert([{ session_id: roomId, user_id: userId, is_ready: false }]);
      if (error) throw error;
    } catch (error) {
      console.error('Error joining room:', error);
    }

    socket.on('disconnect', async () => {
      socket.to(roomId).emit('user-disconnected', userId);
      try {
        const { data, error } = await supabase
          .from('game_session_players')
          .delete()
          .match({ session_id: roomId, user_id: userId });
        if (error) throw error;
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });
  });

  // Genel oyun başlatma (eski fonksiyon - backward compatibility)
  socket.on('start-game', async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .update({ status: 'in_progress' })
        .match({ id: roomId });
      if (error) throw error;
      io.to(roomId).emit('game-started');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});