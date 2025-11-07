// components/MemberList.tsx
import React, { Suspense } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';

// Tema bazlı bileşenleri dinamik olarak import et
const MemberListRedSparrow = React.lazy(() => import('./MemberListRedSparrow'));
const MemberListOceanicDepths = React.lazy(() => import('./MemberListOceanicDepths'));
const MemberListEmeraldForest = React.lazy(() => import('./MemberListEmeraldForest'));
const MemberListRoyalAmethyst = React.lazy(() => import('./MemberListRoyalAmethyst'));
const MemberListClassicIndigo = React.lazy(() => import('./MemberListClassicIndigo'));

// Tüm tema bileşenlerinin kullanacağı ortak prop arayüzü
interface MemberListProps {
  serverId: string;
  serverOwnerId: string;
}

const themeComponentMap: { [key: string]: React.LazyExoticComponent<React.FC<MemberListProps>> } = {
    'red-sparrow': MemberListRedSparrow,
    'oceanic-depths': MemberListOceanicDepths,
    'emerald-forest': MemberListEmeraldForest,
    'royal-amethyst': MemberListRoyalAmethyst,
    'classic-indigo': MemberListClassicIndigo
};

const MemberList: React.FC<MemberListProps> = (props) => {
  const { theme } = useTheme();

  const ThemedComponent = themeComponentMap[theme.name] || themeComponentMap['classic-indigo'];

  return (
    <Suspense fallback={<aside className={`w-64 flex-shrink-0 bg-slate-800 p-3 flex justify-center items-center`}><Spinner /></aside>}>
        <ThemedComponent {...props} />
    </Suspense>
  );
};

export default MemberList;
