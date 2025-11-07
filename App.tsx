// App.tsx
import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import LoadingScreen from './components/LoadingScreen';

// Büyük bileşenleri React.lazy ile dinamik olarak import et
// Bu, her bir bileşen için ayrı bir kod paketi (chunk) oluşturur.
const Auth = React.lazy(() => import('./components/Auth'));
const ChatInterface = React.lazy(() => import('./components/ChatInterface'));
const CreateProfile = React.lazy(() => import('./components/CreateProfile'));

const AppContent = () => {
    const { session, profile, profileStatus, refetchProfile } = useAuth();

    // AuthProvider, ilk oturum ve profil yüklemesi sırasında bir yükleme ekranı gösterir.
    // Bu bileşen render olduğunda, oturum durumu bellidir (ya var ya da yok).
    
    if (!session) {
        // Oturum yoksa, sadece Auth bileşeninin kodunu yükle.
        return <Auth />;
    }
    
    if (profileStatus === 'missing' || !profile) {
        // Oturum var ama profil yoksa, sadece CreateProfile bileşeninin kodunu yükle.
         return <CreateProfile onProfileCreated={refetchProfile} />;
    }
    
    // Oturum ve profil varsa, ana sohbet arayüzünün kodunu yükle.
    return <ChatInterface />;
}


const ThemedApp = () => {
  const { theme } = useTheme();
  return (
    <div className={`h-screen w-screen ${theme.colors.bgPrimary}`}>
        {/*
          Suspense, altındaki lazy bileşenlerin kodu yüklenirken bir 'fallback' (örneğin bir yükleme ekranı) göstermemizi sağlar.
          Kullanıcı giriş yaptığında ChatInterface kodu yüklenirken, LoadingScreen gösterilecektir.
        */}
        <Suspense fallback={<LoadingScreen />}>
            <AppContent />
        </Suspense>
    </div>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;