# 🚀 GitHub Repository Kurulumu

## 📦 Repository Oluşturma Adımları

### 1. GitHub'da Yeni Repository Oluştur
- GitHub.com'a git
- Yeni repository oluştur butonuna tıkla
- Repository ismi: `discord-clone-gartic-phone` (veya istediğin isim)
- Açıklama: "Discord clone with Gartic Phone game integration"
- Public seçeneğini işaretle
- README oluşturma seçeneğini işaretleme (bizim README'miz var)

### 2. Yerel Dosyaları GitHub'a Yükle

Aşağıdaki komutları sırayla çalıştır:

```bash
# Git repository'sini başlat
git init

# Tüm dosyaları ekle
git add .

# Commit oluştur
git commit -m "🎮 Initial commit: Discord Clone + Gartic Phone Game

✨ Features:
- Real-time messaging with themes
- Gartic Phone game integration
- Socket.IO server
- Railway deployment ready
- 5 different themes
- Voice channels
- Friend system

🚀 Tech Stack:
- React 18 + TypeScript
- Node.js + Express + Socket.IO
- Supabase (PostgreSQL)
- Tailwind CSS
- Railway deployment

📁 Structure:
- /src - Frontend components
- /server - Backend Socket.IO server
- /components/games - Game components
- Railway deployment files included"

# Branch adını main yap (GitHub için)
git branch -M main

# GitHub repository'ni ekle
# AŞAĞIDAKİ KOMUTTA KENDİ REPOSITORY URL'Nİ YAZ
git remote add origin https://github.com/YOUR_USERNAME/discord-clone-gartic-phone.git

# GitHub'a yükle
git push -u origin main
```

### 3. Railway Deploy İçin Hazırlık

Repository yüklendikten sonra Railway'de:

1. [Railway.app](https://railway.app)'e git
2. GitHub hesabını bağla
3. Yeni proje oluştur
4. GitHub'dan `discord-clone-gartic-phone` repository'sini seç

### 4. Environment Variables Ayarla

Railway dashboard'da:

```bash
# Backend Environment Variables (Server klasörü için)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=https://your-app-domain.up.railway.app
NODE_ENV=production
PORT=3001

# Frontend Environment Variables (Opsiyonel)
REACT_APP_SOCKET_URL=https://your-app-domain.up.railway.app
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Deploy Ayarları

Railway'de:
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check**: `/health`

## 🎯 Başarılı Deploy İçin Kontrol Listesi

- [ ] GitHub repository'si oluşturuldu
- [ ] Tüm dosyalar yüklendi
- [ ] Railway projesi oluşturuldu
- [ ] Environment variables ayarlandı
- [ ] Deploy başlatıldı
- [ ] Health check çalışıyor
- [ ] Socket.IO bağlantısı test edildi

## 🎮 Gartic Phone Testi

Deploy'dan sonra test etmek için:
1. Uygulamanı aç
2. Bir oda oluştur
3. Gartic Phone oyununu başlat
4. Socket.IO bağlantısını kontrol et

## 📞 Destek

Sorun yaşarsan:
1. Railway dashboard'dan log'ları kontrol et
2. GitHub Issues sekmesinden yardım iste
3. Environment variables'ları tekrar kontrol et

**🚀 Hazırsan deploy'a başlayalım!**