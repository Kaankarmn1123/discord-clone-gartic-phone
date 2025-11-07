// components/FriendActivityPanelEmeraldForest.tsx
import React from 'react';
import type { Profile } from '../types';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';
import { useTheme } from '../contexts/ThemeContext';
import { useFriends } from '../hooks/useFriends'; // YENİ HOOK

const FriendActivityPanelEmeraldForest: React.FC = () => {
  const { theme } = useTheme();
  const { friends, loading } = useFriends();
  
  const onlineFriends = friends.filter(f => f.status !== 'offline');

  if (loading) return <aside className={`w-64 ${theme.colors.bgSecondary} p-3 flex justify-center items-center`}><Spinner /></aside>;
  
  return (
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 border-l border-emerald-900/40 relative`}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-green-950/20 to-slate-950/40 pointer-events-none"></div>
        <div className="relative z-10">
            <h2 className={`text-sm font-serif font-bold uppercase text-emerald-300/80 mb-4 pb-3 border-b-2 border-emerald-500/20`}>AKTİVİTE</h2>
            
            {onlineFriends.length > 0 ? (
                <div className="space-y-3">
                {onlineFriends.map(friend => (
                    <div key={friend.id} className="group flex items-center p-2 rounded-xl transition-all duration-300 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-green-950/50 cursor-pointer">
                        <div className="relative mr-3">
                            <img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-10 h-10 rounded-full border-2 border-emerald-800/60 group-hover:border-emerald-400/60 transition-colors"/>
                            <StatusIndicator status={friend.status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-emerald-950"/>
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-medium text-emerald-100 group-hover:text-emerald-200 truncate transition-colors font-serif`}>{friend.username}</p>
                            <p className="text-xs text-green-300/60 truncate italic">Ormanda...</p>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className={`text-sm text-center font-serif text-emerald-300/50 mt-8`}>Orman sessiz.</p>
            )}
        </div>
    </aside>
  );
};

export default FriendActivityPanelEmeraldForest;
