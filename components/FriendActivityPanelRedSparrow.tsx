// components/FriendActivityPanelRedSparrow.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Friend, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';
import { useTheme } from '../contexts/ThemeContext';

const FriendActivityPanelRedSparrow: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return; setLoading(true);
    const { data } = await supabase.from('friendships').select('*, user1:user1_id(*), user2:user2_id(*)').eq('status', 'accepted').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    if (data) setFriends(data.map(f => (f.user1_id === user.id ? f.user2 : f.user1)).filter(Boolean) as Friend[]);
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
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 border-l-2 border-red-900/40 relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/30 to-black pointer-events-none"></div>
        <h2 className={`text-sm font-black tracking-widest uppercase text-red-400 mb-4 pb-3 border-b-2 border-red-500/30`}>ARKADAŞ AKTİVİTESİ</h2>
        <div className="relative z-10">
            {onlineFriends.length > 0 ? (
                <div className="space-y-2">
                {onlineFriends.map(friend => (
                    <div key={friend.id} className="group flex items-center p-2 transition-all duration-200 hover:bg-red-500/10 cursor-pointer" style={{clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)'}}>
                        <div className="relative mr-3"><img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-10 h-10 border-2 border-red-900 group-hover:border-red-500 transition-colors" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}/><StatusIndicator status={friend.status} className="absolute -bottom-1 -right-1 ring-2 ring-black"/></div>
                        <div>
                            <p className={`text-sm font-black tracking-wider uppercase text-red-100 group-hover:text-red-400 truncate transition-colors`}>{friend.username}</p>
                            <p className="text-xs text-red-400/60 font-mono">AKTİF</p>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className={`text-sm text-center font-mono text-red-400/60 mt-8`}>// KİMSE AKTİF DEĞİL //</p>
            )}
        </div>
    </aside>
  );
};

export default FriendActivityPanelRedSparrow;
