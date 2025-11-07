<div align="center">
<img width="1200" height="475" alt="Discord Clone + Gartic Phone" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎮 Discord Clone + Gartic Phone Game

Modern, responsive Discord benzeri bir sohbet uygulaması ile birlikte Gartic Phone oyunu desteği sunan real-time multiplayer platform.

## ✨ Özellikler

### 🗨️ Temel Sohbet Özellikleri
- **Real-time mesajlaşma** - Anlık mesaj gönderimi ve alımı
- **Sunucu ve kanal yönetimi** - Çoklu sunucu ve kanal desteği
- **Kullanıcı profilleri** - Avatar, durum ve profil özelleştirmeleri
- **Tema desteği** - 5 farklı tema (Classic Indigo, Red Sparrow, Oceanic Depths, Royal Amethyst, Emerald Forest)
- **Sesli sohbet** - Voice channel desteği
- **Arkadaş sistemi** - Arkadaş ekleme, davet gönderme

### 🎮 Gartic Phone Oyunu
- **Real-time çizim** - Çizim gönderme ve tahmin etme
- **Çok oyunculu destek** - 2-8 oyuncu aynı odada
- **Tur geçişleri** - Otomatik tur yönetimi
- **Socket.IO entegrasyonu** - Anlık veri senkronizasyonu

### 🔧 Teknolojiler
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSocket bağlantıları
- **Deploy**: Railway platformu

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 16+
- npm veya yarn
- Supabase hesabı

### Kurulum

1. **Repository'yi klonla**
```bash
git clone https://github.com/YOUR_USERNAME/discord-clone-gartic.git
cd discord-clone-gartic
```

2. **Bağımlılıkları yükle**
```bash
# Frontend bağımlılıkları
npm install

# Backend bağımlılıkları
cd server
npm install
cd ..
```

3. **Environment variables ayarla**
```bash
# .env dosyası oluştur
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Uygulamayı başlat**
```bash
# Frontend
npm start

# Backend (ayrı terminal)
cd server && npm start
```

## 🚄 Railway'e Deploy Etme

### 1. Railway'de Proje Oluştur
- [Railway.app](https://railway.app)'e git
- GitHub hesabını bağla
- Yeni proje oluştur
- Bu repository'yi seç

### 2. Environment Variables
Railway dashboard'da aşağıdaki değerleri ekle:

```bash
# Frontend için
REACT_APP_SOCKET_URL=https://your-app-domain.up.railway.app
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend için
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=https://your-frontend-domain.up.railway.app
NODE_ENV=production
PORT=3001
```

### 3. Deploy Ayarları
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 🎮 Gartic Phone Kullanımı

### Socket.IO Eventleri

#### Odaya Katılma
```javascript
socket.emit('join-gartic-room', roomId, userId, username);
```

#### Oyun Başlatma
```javascript
socket.emit('start-gartic-game', roomId, {
  maxRounds: 5,
  timePerRound: 60,
  gameMode: 'classic'
});
```

#### Çizim Gönderme
```javascript
socket.emit('gartic-submit-drawing', roomId, {
  drawingData: canvasData,
  round: currentRound
});
```

#### Tahmin Gönderme
```javascript
socket.emit('gartic-submit-guess', roomId, {
  guess: 'tahmin',
  round: currentRound
});
```

## 📁 Proje Yapısı

```
├── src/                    # Frontend kaynak kodları
│   ├── components/         # React component'leri
│   ├── contexts/           # React context'leri
│   ├── hooks/              # Custom hook'lar
│   └── services/           # API servisleri
├── server/                 # Backend kaynak kodları
│   ├── server.js          # Socket.IO server
│   └── railway.json       # Railway konfigürasyonu
├── components/games/       # Oyun component'leri
└── railway.toml           # Railway deployment dosyası
```

## 🛠️ Geliştirme

### Frontend Geliştirme
```bash
npm start                 # Development server
npm run build            # Production build
npm test                 # Testleri çalıştır
```

### Backend Geliştirme
```bash
cd server
npm start                # Development server
npm run dev              # Development modu (nodemon)
```

## 🐛 Hata Ayıklama

### Yaygın Sorunlar

1. **Socket.IO Bağlantı Hatası**
   - Environment variables'ları kontrol et
   - CORS ayarlarını kontrol et

2. **Supabase Bağlantı Hatası**
   - Credentials'ları kontrol et
   - Network erişimini kontrol et

3. **Port Çakışması**
   - `PORT` environment variable'ını değiştir

### Log Kontrolü
```bash
# Frontend logs
npm start

# Backend logs
cd server && npm start
```

## 🤝 Katkıda Bulunma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit et (`git commit -m 'Add some amazing feature'`)
4. Push et (`git push origin feature/amazing-feature`)
5. Pull Request aç

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Sorularınız için:
- Issues sekmesinden soru açın
- Railway dashboard'dan log kontrol edin

---

**🎮 Hazırsan Gartic Phone oynamaya başlayalım!**
