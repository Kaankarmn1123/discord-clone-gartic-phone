// src/components/FriendsInterface.tsx
import React, { Suspense } from 'react';
import type { Friend } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';

// Tema bazlı bileşenleri dinamik olarak import et
const FriendsInterfaceRedSparrow = React.lazy(() => import('./FriendsInterfaceRedSparrow'));
const FriendsInterfaceOceanicDepths = React.lazy(() => import('./FriendsInterfaceOceanicDepths'));
const FriendsInterfaceEmeraldForest = React.lazy(() => import('./FriendsInterfaceEmeraldForest'));
const FriendsInterfaceRoyalAmethyst = React.lazy(() => import('./FriendsInterfaceRoyalAmethyst'));
const FriendsInterfaceClassicIndigo = React.lazy(() => import('./FriendsInterfaceClassicIndigo'));


// Tüm tema bileşenlerinin kullanacağı ortak prop arayüzü
interface FriendsInterfaceProps {
    onServerAction: () => void;
    agora: any;
    onStartDm: (friend: Friend) => void;
}

const themeComponentMap: { [key: string]: React.LazyExoticComponent<React.FC<FriendsInterfaceProps>> } = {
    'red-sparrow': FriendsInterfaceRedSparrow,
    'oceanic-depths': FriendsInterfaceOceanicDepths,
    'emerald-forest': FriendsInterfaceEmeraldForest,
    'royal-amethyst': FriendsInterfaceRoyalAmethyst,
    'classic-indigo': FriendsInterfaceClassicIndigo
};


const FriendsInterface: React.FC<FriendsInterfaceProps> = (props) => {
  const { theme } = useTheme();

  const ThemedComponent = themeComponentMap[theme.name] || themeComponentMap['classic-indigo'];

  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Spinner /></div>}>
        <ThemedComponent {...props} />
    </Suspense>
  );
};

export default FriendsInterface;