// components/FriendActivityPanelClassicIndigo.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Friend, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';
import { useTheme } from '../contexts/ThemeContext';

const FriendActivityPanelClassicIndigo: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: friendData } = await supabase.from('friendships').select('*, user1:user1_id(*), user2:user2_id(*)').eq('status', 'accepted').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    if (friendData) {
      const allFriends: Friend[] = friendData.map(friendship => {
        const friendProfile = friendship.user1_id === user.id ? friendship.user2 : friendship.user1;
        if (!friendProfile) return null;
        return { ...friendProfile, friendship_id: friendship.id, friendship_status: friendship.status, action_user_id: friendship.action_user_id };
      }).filter((f): f is Friend => f !== null);
      setFriends(allFriends);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriends();
    const sub = supabase.channel('friend-activity-panel-sub')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `or(user1_id.eq.${user?.id},user2_id.eq.${user?.id})` }, fetchFriends)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: { new: Profile }) => {
            setFriends(current => current.map(f => f.id === payload.new.id ? { ...f, ...payload.new } : f));
        })
        .subscribe();
    return () => { supabase.removeChannel(sub); }
  }, [user, fetchFriends]);
  
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
