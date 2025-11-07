// src/components/FriendActivityPanel.tsx (Dispatcher)
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

import FriendActivityPanelRedSparrow from './FriendActivityPanelRedSparrow';
import FriendActivityPanelOceanicDepths from './FriendActivityPanelOceanicDepths';
import FriendActivityPanelEmeraldForest from './FriendActivityPanelEmeraldForest';
import FriendActivityPanelRoyalAmethyst from './FriendActivityPanelRoyalAmethyst';
import FriendActivityPanelClassicIndigo from './FriendActivityPanelClassicIndigo';

const FriendActivityPanel: React.FC = (props) => {
  const { theme } = useTheme();

  switch (theme.name) {
    case 'red-sparrow':
      return <FriendActivityPanelRedSparrow {...props} />;
    case 'oceanic-depths':
      return <FriendActivityPanelOceanicDepths {...props} />;
    case 'emerald-forest':
      return <FriendActivityPanelEmeraldForest {...props} />;
    case 'royal-amethyst':
      return <FriendActivityPanelRoyalAmethyst {...props} />;
    case 'classic-indigo':
      return <FriendActivityPanelClassicIndigo {...props} />;
    default:
      return <FriendActivityPanelClassicIndigo {...props} />;
  }
};

export default FriendActivityPanel;
