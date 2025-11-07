// components/MemberListRedSparrow.tsx
import React from 'react';
import type { Profile } from '../types';
import StatusIndicator from './StatusIndicator';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';
import { useMembers } from '../hooks/useMembers';

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const OwnerBadge = () => <div title="Sunucu Sahibi" className="ml-2"><StarIcon /></div>;

interface MemberListProps {
  serverId: string;
  serverOwnerId: string;
}

const MemberListRedSparrow: React.FC<MemberListProps> = ({ serverId, serverOwnerId }) => {
  const { theme } = useTheme();
  const { members, loading } = useMembers(serverId);

  const onlineMembers = members.filter(m => m.status !== 'offline');
  const offlineMembers = members.filter(m => m.status === 'offline');
  
  if (loading) return <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-3 flex justify-center items-center`}><Spinner /></aside>;

  return (
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 border-l-2 border-red-900/40 relative overflow-y-auto scrollbar-thin scrollbar-thumb-red-600/40 scrollbar-track-transparent`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/30 to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"><div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)' }}></div></div>
      <div className="relative z-10">
        <h2 className={`text-xs font-black tracking-widest uppercase text-red-400 mb-4 pb-3 border-b-2 border-red-500/30`}>AKTİF ÜYELER — {members.length}</h2>
        
        {onlineMembers.length > 0 && (
          <div className="mb-6">
            <h3 className={`text-[10px] font-black tracking-[0.2em] uppercase text-red-300 mb-3`}>ÇEVRİMİÇİ — {onlineMembers.length}</h3>
            <div className="space-y-1">
              {onlineMembers.map(member => (
                <div key={member.id} className="group relative flex items-center p-2 transition-all duration-200 hover:bg-red-500/10 cursor-pointer" style={{clipPath: 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)'}}>
                  <div className="relative mr-3"><img src={member.avatar_url || `https://robohash.org/${member.id}.png?set=set1&size=40x40`} alt={member.username} className="w-10 h-10 border-2 border-red-900 group-hover:border-red-500 transition-colors" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}/><StatusIndicator status={member.status} className="absolute -bottom-1 -right-1 ring-2 ring-black"/></div>
                  <span className={`text-sm font-black tracking-wider uppercase text-red-100 group-hover:text-red-400 truncate transition-colors`}>{member.username}</span>
                  {member.id === serverOwnerId && <OwnerBadge />}
                </div>
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <h3 className={`text-[10px] font-black tracking-[0.2em] uppercase text-red-400/50 mb-3`}>ÇEVRİMDIŞI — {offlineMembers.length}</h3>
            <div className="space-y-1">
                {offlineMembers.map(member => (
                <div key={member.id} className="group relative flex items-center p-2 opacity-40 hover:opacity-100 transition-opacity" style={{clipPath: 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)'}}>
                    <div className="relative mr-3"><img src={member.avatar_url || `https://robohash.org/${member.id}.png?set=set1&size=40x40`} alt={member.username} className="w-10 h-10 border-2 border-red-900 grayscale group-hover:grayscale-0" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}/><StatusIndicator status={member.status} className="absolute -bottom-1 -right-1 ring-2 ring-black"/></div>
                    <span className={`text-sm font-black tracking-wider uppercase text-red-100/50 group-hover:text-red-400 truncate`}>{member.username}</span>
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

export default MemberListRedSparrow;
