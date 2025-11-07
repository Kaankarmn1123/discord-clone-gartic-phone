// components/FriendActivityPanelClassicIndigo.tsx
import React from 'react';
import type { Profile } from '../types';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';
import { useTheme } from '../contexts/ThemeContext';
import { useFriends } from '../hooks/useFriends'; // YENİ HOOK

const FriendActivityPanelClassicIndigo: React.FC = () => {
  const { theme } = useTheme();
  const { friends, loading } = useFriends();
  
  const onlineFriends = friends.filter(f => f.status !== 'offline');

  if (loading) return <aside className={`w-64 ${theme.colors.bgSecondary} p-3 flex justify-center items-center`}><Spinner /></aside>;
  
  return (
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 overflow-y-auto border-l ${theme.colors.borderPrimary}/50`}>
      <h2 className={`text-lg font-semibold ${theme.colors.textPrimary} mb-4`}>Aktif Olanlar</h2>
      {onlineFriends.length > 0 ? (
        <div className="space-y-3">
          {onlineFriends.map(friend => (
            <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
              <div className="relative flex-shrink-0">
                <img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-10 h-10 rounded-full"/>
                <StatusIndicator status={friend.status} className="absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${theme.colors.textSecondary} truncate`}>{friend.username}</p>
                <p className="text-xs text-slate-400 truncate">Şu anda aktif</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`${theme.colors.textMuted} text-sm text-center mt-4`}>Şu an kimse aktif değil.</p>
      )}
    </aside>
  );
};

export default FriendActivityPanelClassicIndigo;
