// App.tsx
import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import LoadingScreen from './components/LoadingScreen';
import { AppProvider, useAppContext } from './contexts/AppContext';

// Tembel yükleme için bileşenleri dinamik olarak import et
const Auth = React.lazy(() => import('./components/Auth'));
const CreateProfile = React.lazy(() => import('./components/CreateProfile'));
const ChatInterface = React.lazy(() => import('./components/ChatInterface'));

// YENİ MERKEZİ RENDER KONTROLCÜSÜ
const AppContent: React.FC = () => {
    const { session, profile, profileStatus, authLoading } = useAuth();
    // AppProvider'ın alt elemanı olduğu için useAppContext'i burada güvenle kullanabiliriz.
    const { isReady } = useAppContext();

    // 1. AuthProvider oturumu kontrol ederken bekle
    if (authLoading) {
        return <LoadingScreen />;
    }

    // 2. Oturum yoksa, giriş ekranını göster
    if (!session) {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <Auth />
            </Suspense>
        );
    }

    // 3. Oturum var ama profil eksikse, profil oluşturma ekranını göster
    if (profileStatus === 'missing' || !profile) {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <CreateProfile onProfileCreated={() => { /* AuthProvider hallediyor */ }} />
            </Suspense>
        );
    }
    
    // 4. Oturum ve profil var, AMA AppProvider henüz tüm verileri yüklemediyse bekle
    // Bu kontrol, gri/boş ekran sorununu çözen en kritik adımdır.
    if (!isReady) {
        return <LoadingScreen />;
    }

    // 5. Her şey hazır! Ana arayüzü göster
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ChatInterface />
        </Suspense>
    );
};

const ThemedApp: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`h-screen w-screen ${theme.colors.bgPrimary}`}>
      {/* AppProvider artık tüm uygulama mantığını sarmalıyor */}
      <AppProvider>
        <AppContent />
      </AppProvider>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      {/* AuthProvider, ThemedApp'i sarmalayarak alt bileşenlerin useAuth'u kullanmasını sağlar */}
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
