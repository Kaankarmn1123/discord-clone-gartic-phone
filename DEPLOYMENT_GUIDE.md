# 🚄 Railway Deployment Guide - Discord Clone + Gartic Phone

## 📋 Repository Bilgileri

Bu repository aşağıdaki özellikleri içerir:
- **Frontend**: React TypeScript uygulaması
- **Backend**: Socket.IO server (Gartic Phone destekli)
- **Database**: Supabase entegrasyonu
- **Real-time**: WebSocket bağlantıları

## 🚀 Railway'e Deploy Adımları

### 1. GitHub Repository'si Oluştur

1. GitHub'da yeni repository oluştur:
```bash
git init
git add .
git commit -m "Initial commit - Discord Clone with Gartic Phone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Railway'de Proje Kurulumu

1. [Railway.app](https://railway.app)'e git
2. GitHub hesabını bağla
3. Yeni proje oluştur
4. GitHub repository'ni seç

### 3. Environment Variables Ayarla

Railway dashboard'da aşağıdaki environment variables'ları ekle:

```bash
# Frontend için
REACT_APP_SOCKET_URL=https://your-app-domain.up.railway.app
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend için (Server klasöründe)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=https://your-frontend-domain.up.railway.app
NODE_ENV=production
PORT=3001
```

### 4. Deploy Ayarları

Railway dashboard'da:
- **Root Directory**: `server` (backend için)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 5. Gartic Phone Özellikleri

Socket.IO server'ında şu eventler aktif:
- `join-gartic-room` - Odaya katıl
- `start-gartic-game` - Oyun başlat
- `gartic-submit-drawing` - Çizim gönder
- `gartic-submit-guess` - Tahmin gönder
- `gartic-next-round` - Sonraki tur

## 🎯 Test Etme

Deploy'dan sonra:
1. `/health` endpoint'ini test et
2. Socket.IO bağlantısını kontrol et
3. Gartic Phone oyununu dene

## 🔧 Sorun Giderme

- **Port 3001**: Backend için varsayılan port
- **CORS**: FRONTEND_URL environment variable'ını kontrol et
- **WebSocket**: Railway'de WebSocket desteği otomatik olarak aktiftir

## 📁 Önemli Dosyalar

- `/server/server.js` - Socket.IO backend
- `/server/railway.json` - Railway konfigürasyonu
- `/src/components/GarticPhoneSocketExample.tsx` - Frontend örneği
- `/railway.toml` - Ana deployment konfigürasyonu