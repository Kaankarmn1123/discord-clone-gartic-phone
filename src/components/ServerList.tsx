// src/components/ServerList.tsx
import React, { Suspense } from 'react';
import type { Server } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';

// Tema bazlı bileşenleri dinamik olarak import et
const ServerListRedSparrow = React.lazy(() => import('./ServerListRedSparrow'));
const ServerListOceanicDepths = React.lazy(() => import('./ServerListOceanicDepths'));
const ServerListEmeraldForest = React.lazy(() => import('./ServerListEmeraldForest'));
const ServerListRoyalAmethyst = React.lazy(() => import('./ServerListRoyalAmethyst'));
const ServerListClassicIndigo = React.lazy(() => import('./ServerListClassicIndigo'));

// Tüm tema bileşenlerinin kullanacağı ortak prop arayüzü
interface ServerListProps {
  servers: Server[];
  onServerSelect: (server: Server | null) => void | Promise<void>;
  activeServerId: string | undefined;
  currentView: 'friends' | 'server' | 'admin' | 'dm' | 'discover';
  onServerCreated: (server: Server) => void;
  onAdminSelect: () => void;
  onDiscoverSelect: () => void;
}

const themeComponentMap: { [key: string]: React.LazyExoticComponent<React.FC<ServerListProps>> } = {
    'red-sparrow': ServerListRedSparrow,
    'oceanic-depths': ServerListOceanicDepths,
    'emerald-forest': ServerListEmeraldForest,
    'royal-amethyst': ServerListRoyalAmethyst,
    'classic-indigo': ServerListClassicIndigo
};

const ServerList: React.FC<ServerListProps> = (props) => {
  const { theme } = useTheme();

  const ThemedComponent = themeComponentMap[theme.name] || themeComponentMap['classic-indigo'];

  return (
    <Suspense fallback={<div className="w-full h-24 md:h-32 flex-shrink-0 flex items-center justify-center bg-slate-900"><Spinner /></div>}>
        <ThemedComponent {...props} />
    </Suspense>
  );
};

export default ServerList;