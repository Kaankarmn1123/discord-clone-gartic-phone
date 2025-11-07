// components/FriendActivityPanelOceanicDepths.tsx
import React from 'react';
import type { Profile } from '../types';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';
import { useTheme } from '../contexts/ThemeContext';
import { useFriends } from '../hooks/useFriends'; // YENİ HOOK

const FriendActivityPanelOceanicDepths: React.FC = () => {
  const { theme } = useTheme();
  const { friends, loading } = useFriends();
  
  const onlineFriends = friends.filter(f => f.status !== 'offline');

  if (loading) return <aside className={`w-64 ${theme.colors.bgSecondary} p-3 flex justify-center items-center`}><Spinner /></aside>;
  
  return (
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 border-l border-blue-900/30 relative`}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 via-cyan-950/30 to-slate-950/50 pointer-events-none"></div>
        <div className="relative z-10">
            <h2 className={`text-sm font-semibold tracking-wide text-cyan-200/80 mb-4 pb-3 border-b border-cyan-500/20`}>AKTİVİTE</h2>
            
            {onlineFriends.length > 0 ? (
                <div className="space-y-3">
                {onlineFriends.map(friend => (
                    <div key={friend.id} className="group flex items-center p-2 rounded-2xl transition-all duration-300 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-cyan-900/50 cursor-pointer">
                        <div className="relative mr-3">
                            <img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-10 h-10 rounded-full border-2 border-blue-800/50 group-hover:border-cyan-400/50 transition-colors"/>
                            <StatusIndicator status={friend.status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-blue-950"/>
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-medium text-blue-100 group-hover:text-cyan-200 truncate transition-colors`}>{friend.username}</p>
                            <p className="text-xs text-blue-300/60 truncate">Şu anda aktif</p>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className={`text-sm text-center font-light text-blue-300/50 mt-8`}>Kimse aktif değil.</p>
            )}
        </div>
    </aside>
  );
};

export default FriendActivityPanelOceanicDepths;
