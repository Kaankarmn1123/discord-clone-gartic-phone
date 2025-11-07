// components/ChannelList.tsx
import React, { Suspense } from 'react';
import type { Server, Channel } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';

// Tema bazlı bileşenleri dinamik olarak import et
const ChannelListRedSparrow = React.lazy(() => import('./ChannelListRedSparrow'));
const ChannelListOceanicDepths = React.lazy(() => import('./ChannelListOceanicDepths'));
const ChannelListEmeraldForest = React.lazy(() => import('./ChannelListEmeraldForest'));
const ChannelListRoyalAmethyst = React.lazy(() => import('./ChannelListRoyalAmethyst'));
const ChannelListClassicIndigo = React.lazy(() => import('./ChannelListClassicIndigo'));


// Tüm tema bileşenlerinin kullanacağı ortak prop arayüzü
interface ChannelListProps {
    server: Server;
    onChannelSelect: (channel: Channel) => void;
    activeChannelId: string | undefined;
    onServerUpdate: (updatedServer: Server) => void;
    agora: any;
    showLegacyVoiceControls: boolean;
    isCollapsed: boolean;
    onToggle: () => void;
}

const themeComponentMap: { [key: string]: React.LazyExoticComponent<React.FC<ChannelListProps>> } = {
    'red-sparrow': ChannelListRedSparrow,
    'oceanic-depths': ChannelListOceanicDepths,
    'emerald-forest': ChannelListEmeraldForest,
    'royal-amethyst': ChannelListRoyalAmethyst,
    'classic-indigo': ChannelListClassicIndigo
};

const ChannelList: React.FC<ChannelListProps> = (props) => {
  const { theme } = useTheme();

  const ThemedComponent = themeComponentMap[theme.name] || themeComponentMap['classic-indigo'];

  return (
     <Suspense fallback={<div className={`transition-all duration-300 ease-in-out ${props.isCollapsed ? 'w-0' : 'w-64'} h-full flex-shrink-0 flex items-center justify-center bg-slate-800`}><Spinner /></div>}>
        <ThemedComponent {...props} />
    </Suspense>
  );
};

export default ChannelList;