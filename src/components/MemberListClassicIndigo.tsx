// components/MemberListClassicIndigo.tsx
import React from 'react';
import type { Profile } from '../types';
import StatusIndicator from './StatusIndicator';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from './Spinner';
import { useMembers } from '../hooks/useMembers';

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const OwnerBadge = () => (
  <span title="Sunucu Sahibi" className="ml-1.5">
    <StarIcon />
  </span>
);


interface MemberListProps {
  serverId: string;
  serverOwnerId: string;
}

const MemberListClassicIndigo: React.FC<MemberListProps> = ({ serverId, serverOwnerId }) => {
  const { theme } = useTheme();
  const { members, loading } = useMembers(serverId);

  const onlineMembers = members.filter(m => m.status !== 'offline');
  const offlineMembers = members.filter(m => m.status === 'offline');
  
  if (loading) return <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-3 flex justify-center items-center`}><Spinner /></aside>;

  return (
    <aside className={`w-64 flex-shrink-0 ${theme.colors.bgSecondary} p-4 overflow-y-auto border-l ${theme.colors.borderPrimary}/50`}>
      <h2 className={`text-xs font-bold uppercase ${theme.colors.textMuted} mb-3`}>Üyeler — {members.length}</h2>
      
      {onlineMembers.length > 0 && (
        <div className="mb-4">
          <h3 className={`text-xs font-semibold uppercase ${theme.colors.textMuted} mb-2`}>Çevrimiçi — {onlineMembers.length}</h3>
          <div className="space-y-2">
            {onlineMembers.map(member => (
              <div key={member.id} className="flex items-center p-1.5 rounded-md hover:bg-slate-700/40 transition-colors">
                <div className="relative mr-2.5">
                  <img src={member.avatar_url || `https://robohash.org/${member.id}.png?set=set1&size=40x40`} alt={member.username} className="w-8 h-8 rounded-full"/>
                  <StatusIndicator status={member.status} className="absolute -bottom-0.5 -right-0.5" />
                </div>
                <span className={`text-sm ${theme.colors.textSecondary} truncate`}>{member.username}</span>
                {member.id === serverOwnerId && <OwnerBadge />}
              </div>
            ))}
          </div>
        </div>
      )}

      {offlineMembers.length > 0 && (
        <div>
          <h3 className={`text-xs font-semibold uppercase ${theme.colors.textMuted} mb-2`}>Çevrimdışı — {offlineMembers.length}</h3>
          <div className="space-y-2">
              {offlineMembers.map(member => (
              <div key={member.id} className="flex items-center p-1.5 rounded-md hover:bg-slate-700/40 transition-colors opacity-50">
                  <div className="relative mr-2.5">
                  <img src={member.avatar_url || `https://robohash.org/${member.id}.png?set=set1&size=40x40`} alt={member.username} className="w-8 h-8 rounded-full" />
                  <StatusIndicator status={member.status} className="absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <span className={`text-sm ${theme.colors.textMuted} truncate`}>{member.username}</span>
                  {member.id === serverOwnerId && <OwnerBadge />}
              </div>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default MemberListClassicIndigo;
