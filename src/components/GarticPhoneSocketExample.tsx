import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface GarticGameProps {
  roomId: string;
  userId: string;
  username: string;
}

interface GameSettings {
  maxRounds: number;
  timePerRound: number;
  gameMode: 'classic' | 'custom';
}

const GarticPhoneSocketExample: React.FC<GarticGameProps> = ({ roomId, userId, username }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    // Socket.IO bağlantısını kur
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO bağlantısı kuruldu');
      setIsConnected(true);
      
      // Gartic Phone odasına katıl
      newSocket.emit('join-gartic-room', roomId, userId, username);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO bağlantısı kesildi');
      setIsConnected(false);
    });

    // Gartic Phone eventleri
    newSocket.on('gartic-room-joined', (data) => {
      console.log('✅ Gartic Phone odasına katıldınız:', data);
    });

    newSocket.on('user-joined-gartic', (userData) => {
      console.log('👤 Yeni oyuncu katıldı:', userData);
      setPlayers(prev => [...prev, userData.username]);
    });

    newSocket.on('user-left-gartic', (userData) => {
      console.log('👋 Oyuncu ayrıldı:', userData);
      setPlayers(prev => prev.filter(player => player !== userData.username));
    });

    newSocket.on('gartic-game-started', (gameData) => {
      console.log('🎮 Gartic Phone oyunu başladı:', gameData);
      setGameStarted(true);
      setCurrentRound(1);
    });

    newSocket.on('gartic-round-update', (roundData) => {
      console.log('🔄 Yeni tur:', roundData);
      setCurrentRound(roundData.round);
    });

    newSocket.on('gartic-new-drawing', (drawingData) => {
      console.log('🎨 Yeni çizim geldi:', drawingData);
      // Çizimi işle
    });

    newSocket.on('gartic-new-guess', (guessData) => {
      console.log('💭 Yeni tahmin geldi:', guessData);
      // Tahmini işle
    });

    newSocket.on('error', (error) => {
      console.error('❌ Server hatası:', error.message);
      alert(`Hata: ${error.message}`);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, userId, username]);

  const startGame = () => {
    if (socket) {
      const gameSettings: GameSettings = {
        maxRounds: 5,
        timePerRound: 60,
        gameMode: 'classic'
      };
      
      socket.emit('start-gartic-game', roomId, gameSettings);
      console.log('🎮 Oyun başlatılıyor...');
    }
  };

  const submitDrawing = (drawingData: string) => {
    if (socket) {
      socket.emit('gartic-submit-drawing', roomId, {
        drawingData,
        round: currentRound,
        userId
      });
      console.log('🎨 Çizim gönderildi');
    }
  };

  const submitGuess = (guess: string) => {
    if (socket) {
      socket.emit('gartic-submit-guess', roomId, {
        guess,
        round: currentRound,
        userId
      });
      console.log('💭 Tahmin gönderildi');
    }
  };

  const nextRound = () => {
    if (socket) {
      socket.emit('gartic-next-round', roomId, {
        round: currentRound + 1,
        nextPlayer: players[(currentRound) % players.length]
      });
      console.log('🔄 Sonraki tura geçiliyor...');
    }
  };

  return (
    <div className="gartic-phone-game p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🎮 Gartic Phone</h2>
      
      {/* Bağlantı Durumu */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {isConnected ? '✅ Bağlandı' : '❌ Bağlantı Yok'}
        </span>
      </div>

      {/* Oda Bilgileri */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <p><strong>Oda ID:</strong> {roomId}</p>
        <p><strong>Kullanıcı:</strong> {username}</p>
        <p><strong>Tur:</strong> {currentRound}</p>
        <p><strong>Oyuncular:</strong> {players.join(', ') || 'Henüz kimse yok'}</p>
      </div>

      {/* Oyun Kontrolleri */}
      <div className="space-y-3">
        {!gameStarted ? (
          <button
            onClick={startGame}
            disabled={!isConnected}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
          >
            🚀 Oyunu Başlat
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={nextRound}
              disabled={!isConnected}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded"
            >
              ⏭️ Sonraki Tur
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => submitDrawing('canvas_data_example')}
                disabled={!isConnected}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
              >
                🎨 Çizim Gönder
              </button>
              
              <button
                onClick={() => submitGuess('tahmin_example')}
                disabled={!isConnected}
                className="flex-1 py-2 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded"
              >
                💭 Tahmin Gönder
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Debug Bilgileri */}
      <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
        <p><strong>Socket ID:</strong> {socket?.id || 'Yok'}</p>
        <p><strong>Oyun Durumu:</strong> {gameStarted ? 'Devam Ediyor' : 'Beklemede'}</p>
      </div>
    </div>
  );
};

export default GarticPhoneSocketExample;