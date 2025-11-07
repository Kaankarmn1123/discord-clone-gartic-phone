// components/ChatInterface.tsx
import React, { Suspense } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';

// Tembel yükleme için tema bileşenlerini dinamik olarak import et
const ChatInterfaceRedSparrow = React.lazy(() => import('./ChatInterfaceRedSparrow'));
const ChatInterfaceOceanicDepths = React.lazy(() => import('./ChatInterfaceOceanicDepths'));
const ChatInterfaceEmeraldForest = React.lazy(() => import('./ChatInterfaceEmeraldForest'));
const ChatInterfaceRoyalAmethyst = React.lazy(() => import('./ChatInterfaceRoyalAmethyst'));
const ChatInterfaceClassicIndigo = React.lazy(() => import('./ChatInterfaceClassicIndigo'));

const themeComponentMap: { [key: string]: React.LazyExoticComponent<React.FC<{}>> } = {
    'red-sparrow': ChatInterfaceRedSparrow,
    'oceanic-depths': ChatInterfaceOceanicDepths,
    'emerald-forest': ChatInterfaceEmeraldForest,
    'royal-amethyst': ChatInterfaceRoyalAmethyst,
    'classic-indigo': ChatInterfaceClassicIndigo
};

const ChatInterface: React.FC = () => {
  const { theme } = useTheme();

  // Aktif temaya göre doğru tembel bileşeni seç
  const ThemedComponent = themeComponentMap[theme.name] || themeComponentMap['classic-indigo'];

  return (
    // Bileşen kodu yüklenirken bir Spinner göster
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Spinner /></div>}>
        <ThemedComponent />
    </Suspense>
  );
};

export default ChatInterface;