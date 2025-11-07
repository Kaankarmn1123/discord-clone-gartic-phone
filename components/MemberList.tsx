// components/MemberList.tsx (Dispatcher)
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { Server } from '../types';

import MemberListRedSparrow from './MemberListRedSparrow';
import MemberListOceanicDepths from './MemberListOceanicDepths';
import MemberListEmeraldForest from './MemberListEmeraldForest';
import MemberListRoyalAmethyst from './MemberListRoyalAmethyst';
import MemberListClassicIndigo from './MemberListClassicIndigo';

interface MemberListProps {
  serverId: string;
  serverOwnerId: string;
}

const MemberList: React.FC<MemberListProps> = (props) => {
  const { theme } = useTheme();

  switch (theme.name) {
    case 'red-sparrow':
      return <MemberListRedSparrow {...props} />;
    case 'oceanic-depths':
      return <MemberListOceanicDepths {...props} />;
    case 'emerald-forest':
      return <MemberListEmeraldForest {...props} />;
    case 'royal-amethyst':
      return <MemberListRoyalAmethyst {...props} />;
    case 'classic-indigo':
      return <MemberListClassicIndigo {...props} />;
    default:
      return <MemberListClassicIndigo {...props} />;
  }
};

export default MemberList;
