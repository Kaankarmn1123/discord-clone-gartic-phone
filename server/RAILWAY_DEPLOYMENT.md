# Railway Deployment Guide - Gartic Phone Socket.IO Server

## 🚄 Railway'e Deploy Etme Adımları

### 1. Railway Hesabı ve Proje Kurulumu
- [Railway](https://railway.app) hesabı oluşturun
- Yeni bir proje oluşturun
- GitHub hesabınızı bağlayın

### 2. Environment Variables Ayarlama
Railway dashboard'da aşağıdaki environment variables'ları ekleyin:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Frontend URL (CORS için)
FRONTEND_URL=https://your-frontend-domain.up.railway.app

# Server Configuration
PORT=3001
NODE_ENV=production
```

### 3. Deploy Ayarları
- Repository'nizi Railway'e bağlayın
- **Root Directory**: `server` olarak ayarlayın
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Gartic Phone Oyunu İçin Socket.IO Eventleri

Server'da şu yeni Gartic Phone eventleri aktif:

#### Oda Katılımı
```javascript
// Client'ta kullanım:
socket.emit('join-gartic-room', roomId, userId, username);

// Server'dan gelen cevaplar:
socket.on('gartic-room-joined', (data) => {
  console.log('Odaya katıldınız:', data);
});

socket.on('user-joined-gartic', (userData) => {
  console.log('Yeni kullanıcı katıldı:', userData);
});
```

#### Oyun Başlatma
```javascript
// Client'ta kullanım:
socket.emit('start-gartic-game', roomId, {
  maxRounds: 5,
  timePerRound: 60,
  gameMode: 'classic'
});

// Server'dan gelen cevap:
socket.on('gartic-game-started', (gameData) => {
  console.log('Oyun başladı:', gameData);
});
```

#### Çizim ve Tahmin Gönderme
```javascript
// Çizim gönderme:
socket.emit('gartic-submit-drawing', roomId, {
  drawingData: canvasData,
  round: 1
});

// Tahmin gönderme:
socket.emit('gartic-submit-guess', roomId, {
  guess: 'kedi',
  round: 2
});
```

#### Tur Geçişleri
```javascript
// Client'ta:
socket.on('gartic-round-update', (roundData) => {
  console.log('Yeni tur:', roundData);
});

socket.on('gartic-new-drawing', (drawingData) => {
  console.log('Yeni çizim:', drawingData);
});

socket.on('gartic-new-guess', (guessData) => {
  console.log('Yeni tahmin:', guessData);
});
```

### 5. Hata Yönetimi
```javascript
// Server hataları:
socket.on('error', (error) => {
  console.error('Server hatası:', error.message);
});
```

### 6. Health Check Endpoint
Server'da `/health` endpoint'i mevcut:
```bash
curl https://your-server-domain.up.railway.app/health
```

### 7. Log Kontrolü
Railway dashboard'da logs sekmesinden tüm Socket.IO bağlantılarını ve Gartic Phone oyun olaylarını izleyebilirsiniz.

## 🎮 Gartic Phone Akışı

1. **Oda Oluşturma**: Kullanıcı oda oluşturur
2. **Katılım**: Diğer kullanıcılar `join-gartic-room` ile katılır
3. **Oyun Başlatma**: Oda sahibi `start-gartic-game` ile oyunu başlatır
4. **Tur Geçişleri**: `gartic-next-round` ile tur ilerler
5. **Çizim/Tahmin**: Oyuncular sırayla çizim ve tahmin gönderir

## 🔧 Sorun Giderme

- **CORS Hataları**: `FRONTEND_URL` environment variable'ını kontrol edin
- **Bağlantı Hataları**: Supabase credentials'larınızı kontrol edin
- **Socket.IO Bağlantısı**: WebSocket desteğinin aktif olduğundan emin olun

## 📞 Destek

Railway dashboard'da logs sekmesinden tüm hataları görebilir ve gerekirse Railway destek ekibine başvurabilirsiniz.