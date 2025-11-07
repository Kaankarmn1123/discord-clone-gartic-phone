// components/DiscoverServers.tsx (Dispatcher)
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

import DiscoverServersRedSparrow from './DiscoverServersRedSparrow';
import DiscoverServersOceanicDepths from './DiscoverServersOceanicDepths';
import DiscoverServersEmeraldForest from './DiscoverServersEmeraldForest';
import DiscoverServersRoyalAmethyst from './DiscoverServersRoyalAmethyst';
import DiscoverServersClassicIndigo from './DiscoverServersClassicIndigo';

interface DiscoverServersProps {
  onServerJoined: () => void;
}

const DiscoverServersDispatcher: React.FC<DiscoverServersProps> = (props) => {
  const { theme } = useTheme();

  switch (theme.name) {
    case 'red-sparrow':
      return <DiscoverServersRedSparrow {...props} />;
    case 'oceanic-depths':
      return <DiscoverServersOceanicDepths {...props} />;
    case 'emerald-forest':
      return <DiscoverServersEmeraldForest {...props} />;
    case 'royal-amethyst':
      return <DiscoverServersRoyalAmethyst {...props} />;
    case 'classic-indigo':
      return <DiscoverServersClassicIndigo {...props} />;
    default:
      return <DiscoverServersClassicIndigo {...props} />;
  }
};

export default DiscoverServersDispatcher;
