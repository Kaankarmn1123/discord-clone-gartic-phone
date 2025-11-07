// components/MemberListEmeraldForest.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Profile } from '../types';
import StatusIndicator from './StatusIndicator';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.7)]" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const OwnerBadge = () => <div title="Sunucu Sahibi" className="ml-2"><StarIcon /></div>;

interface MemberListProps {
  serverId: string;
  serverOwnerId: string;
}

const MemberListEmeraldForest: React.FC<MemberListProps> = ({ serverId, serverOwnerId }) => {
  const { theme } = useTheme();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!serverId) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    const { data: membershipData } = await supabase.from('memberships').select('user_id').eq('server_id', serverId);
    if (!membershipData || membershipData.length === 0) { setMembers([]); setLoading(false); return; }
    const { data: profileData } = await supabase.from('profiles').select('*').in('id', membershipData.map(m => m.user_id));
    if (profileData) setMembers((profileData as Profile[]).sort((a, b) => a.username.localeCompare(b.username)));
    setLoading(false);
  }, [serverId]);

  useEffect(() => {
    fetchMembers();
    const sub = supabase.channel(`member-list-updates-for-server-${serverId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `server_id=eq.${serverId}` }, fetchMembers)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: { new: Profile }) => {
            setMembers(current => current.map(m => (m.id === payload.new.id ? payload.new : m)).sort((a, b) => a.username.localeCompare(b.username)));
        })
        .subscribe();
    return () => { supabase.removeChannel(sub); }
  }, [serverId, fetchMembers]);

  const onlineMembers = members.filter(m => m.status !== 'offline');
  const offlineMembers = members.filter(m => m.status === 'offline');
  
  if (loading) return <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-3 flex justify-center items-center`}><Spinner /></aside>;

  return (
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 border-l border-emerald-900/40 relative overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-transparent`}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-green-950/20 to-slate-950/40 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none"><div className="absolute top-0 left-1/5 w-24 h-full bg-gradient-to-b from-emerald-300/20 via-green-400/10 to-transparent blur-3xl animate-sway-light"></div></div>
        <div className="relative z-10">
            <h2 className={`text-xs font-serif font-bold uppercase text-emerald-300/80 mb-4 pb-3 border-b-2 border-emerald-500/20`}>TOPLULUK — {members.length}</h2>
            
            {onlineMembers.length > 0 && (
            <div className="mb-6">
                <h3 className={`text-xs font-semibold uppercase text-emerald-300/70 mb-3`}>Çevrimiçi — {onlineMembers.length}</h3>
                <div className="space-y-2">
                {onlineMembers.map(member => (
                    <div key={member.id} className="group flex items-center p-2 rounded-xl transition-all duration-300 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-green-950/50 cursor-pointer">
                    <div className="relative mr-3">
                        <img src={member.avatar_url || `https://robohash.org/${member.id}.png?set=set1&size=40x40`} alt={member.username} className="w-10 h-10 rounded-full border-2 border-emerald-800/60 group-hover:border-emerald-400/60 transition-colors"/>
                        <StatusIndicator status={member.status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-emerald-950"/>
                    </div>
                    <span className={`text-sm font-medium text-emerald-100 group-hover:text-emerald-200 truncate transition-colors font-serif`}>{member.username}</span>
                    {member.id === serverOwnerId && <OwnerBadge />}
                    </div>
                ))}
                </div>
            </div>
            )}

            {offlineMembers.length > 0 && (
            <div>
                <h3 className={`text-xs font-semibold uppercase text-emerald-300/40 mb-3`}>Çevrimdışı — {offlineMembers.length}</h3>
                <div className="space-y-2">
                    {offlineMembers.map(member => (
                    <div key={member.id} className="group flex items-center p-2 rounded-xl transition-all duration-300 hover:bg-emerald-500/10 opacity-50 hover:opacity-100">
                        <div className="relative mr-3">
                        <img src={member.avatar_url || `https://robohash.org/${member.id}.png?set=set1&size=40x40`} alt={member.username} className="w-10 h-10 rounded-full border-2 border-emerald-800/60 grayscale group-hover:grayscale-0"/>
                        <StatusIndicator status={member.status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-emerald-950"/>
                        </div>
                        <span className={`text-sm font-medium text-emerald-100/60 group-hover:text-emerald-200 truncate font-serif`}>{member.username}</span>
                        {member.id === serverOwnerId && <OwnerBadge />}
                    </div>
                    ))}
                </div>
            </div>
            )}
        </div>
    </aside>
  );
};

export default MemberListEmeraldForest;
